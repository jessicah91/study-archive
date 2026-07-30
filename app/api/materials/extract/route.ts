import { NextResponse } from "next/server";

import { parsePdfBuffer } from "@/lib/ai/parser";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STORAGE_BUCKET = "study-materials";
const MAX_PDF_SIZE = 20 * 1024 * 1024;

type ExtractRequestBody = {
  materialId?: string;
};

function isPdfFile(
  originalName: string,
  fileType: string | null,
) {
  const extension =
    originalName.split(".").pop()?.toLowerCase() ?? "";

  return (
    extension === "pdf" ||
    fileType === "application/pdf"
  );
}

export async function POST(request: Request) {
  try {
    let body: ExtractRequestBody;

    try {
      body = (await request.json()) as ExtractRequestBody;
    } catch {
      return NextResponse.json(
        {
          error: "요청 내용을 읽지 못했어요.",
        },
        {
          status: 400,
        },
      );
    }

    const materialId = body.materialId?.trim();

    if (!materialId) {
      return NextResponse.json(
        {
          error: "자료 ID가 필요해요.",
        },
        {
          status: 400,
        },
      );
    }

    const { data: material, error: materialError } =
      await supabaseAdmin
        .from("study_materials")
        .select(
          `
            id,
            subject_id,
            week_id,
            original_name,
            storage_path,
            file_type,
            file_size
          `,
        )
        .eq("id", materialId)
        .maybeSingle();

    if (materialError) {
      console.error(materialError);

      return NextResponse.json(
        {
          error: `자료 정보를 불러오지 못했어요: ${materialError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    if (!material) {
      return NextResponse.json(
        {
          error: "존재하지 않는 자료예요.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      !isPdfFile(
        material.original_name,
        material.file_type,
      )
    ) {
      return NextResponse.json(
        {
          error: "현재 텍스트 추출은 PDF 파일만 지원해요.",
        },
        {
          status: 400,
        },
      );
    }

    if (material.file_size > MAX_PDF_SIZE) {
      return NextResponse.json(
        {
          error: "20MB를 초과하는 PDF는 처리할 수 없어요.",
        },
        {
          status: 400,
        },
      );
    }

    const { error: pendingError } =
      await supabaseAdmin
        .from("study_document_contents")
        .upsert(
          {
            material_id: material.id,
            ai_status: "extracting",
          },
          {
            onConflict: "material_id",
          },
        );

    if (pendingError) {
      console.error(pendingError);

      return NextResponse.json(
        {
          error: `처리 상태를 저장하지 못했어요: ${pendingError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    const { data: fileBlob, error: downloadError } =
      await supabaseAdmin.storage
        .from(STORAGE_BUCKET)
        .download(material.storage_path);

    if (downloadError || !fileBlob) {
      console.error(downloadError);

      await supabaseAdmin
        .from("study_document_contents")
        .update({
          ai_status: "failed",
        })
        .eq("material_id", material.id);

      return NextResponse.json(
        {
          error: `PDF 파일을 내려받지 못했어요: ${
            downloadError?.message ??
            "파일 데이터가 없습니다."
          }`,
        },
        {
          status: 500,
        },
      );
    }

    const arrayBuffer = await fileBlob.arrayBuffer();

    const parsed = await parsePdfBuffer(
      Buffer.from(arrayBuffer),
    );

    const { data: savedContent, error: saveError } =
      await supabaseAdmin
        .from("study_document_contents")
        .upsert(
          {
            material_id: material.id,
            extracted_text: parsed.text,
            ai_status: "extracted",
          },
          {
            onConflict: "material_id",
          },
        )
        .select(
          `
            id,
            material_id,
            ai_status,
            created_at
          `,
        )
        .single();

    if (saveError) {
      console.error(saveError);

      await supabaseAdmin
        .from("study_document_contents")
        .update({
          ai_status: "failed",
        })
        .eq("material_id", material.id);

      return NextResponse.json(
        {
          error: `추출한 텍스트를 저장하지 못했어요: ${saveError.message}`,
        },
        {
          status: 500,
        },
      );
    }

    return NextResponse.json({
      message: "PDF 텍스트 추출이 완료됐어요.",
      content: savedContent,
      result: {
        pageCount: parsed.pageCount,
        characterCount: parsed.characterCount,
        preview: parsed.text.slice(0, 500),
      },
    });
  } catch (error) {
    console.error("PDF extraction error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "PDF 텍스트 추출 중 오류가 발생했어요.";

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: 500,
      },
    );
  }
}