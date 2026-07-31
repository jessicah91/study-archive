"use client";

import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { supabase } from "@/lib/supabase";

const DAYS = [
  { value: 1, label: "월" },
  { value: 2, label: "화" },
  { value: 3, label: "수" },
  { value: 4, label: "목" },
  { value: 5, label: "금" },
] as const;

const PASTEL_COLORS = [
  "#E8E2FF",
  "#DCEBFF",
  "#FFE1EC",
  "#DDF5E5",
  "#FFF0C9",
  "#FFE4D4",
  "#D8F3F5",
  "#E1E7FF",
  "#FFE0DD",
  "#D9F3EC",
  "#EFE0FF",
  "#DDF0FF",
];

const START_HOUR = 8;
const END_HOUR = 22;
const HOUR_HEIGHT = 72;
const SLOT_MINUTES = 30;
const TOTAL_HOURS = END_HOUR - START_HOUR;

type TimetableRow = {
  id: string;
  course_group_id: string;
  course_name: string;
  professor: string | null;
  classroom: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  color: string;
  created_at: string;
};

type ClassForm = {
  groupId: string | null;
  courseName: string;
  professor: string;
  classroom: string;
  selectedDays: number[];
  startTime: string;
  endTime: string;
  color: string | null;
};

const INITIAL_FORM: ClassForm = {
  groupId: null,
  courseName: "",
  professor: "",
  classroom: "",
  selectedDays: [1],
  startTime: "09:00",
  endTime: "10:30",
  color: null,
};

function timeToMinutes(time: string) {
  const normalized = time.slice(0, 5);
  const [hour = 0, minute = 0] = normalized.split(":").map(Number);

  return hour * 60 + minute;
}

function minutesToTime(totalMinutes: number) {
  const safeMinutes = Math.max(0, totalMinutes);
  const hour = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;

  return `${String(hour).padStart(2, "0")}:${String(
    minute,
  ).padStart(2, "0")}`;
}

function formatTime(time: string) {
  return time.slice(0, 5);
}

function createGroupId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}


function getCurrentSemester() {
  const now = new Date();
  const year = now.getFullYear();
  const semester = now.getMonth() < 6 ? 1 : 2;

  return `${year}년 ${semester}학기`;
}

function getBlockPosition(item: TimetableRow) {
  const timetableStartMinutes = START_HOUR * 60;
  const startMinutes = timeToMinutes(item.start_time);
  const endMinutes = timeToMinutes(item.end_time);

  return {
    top:
      ((startMinutes - timetableStartMinutes) / 60) *
      HOUR_HEIGHT,
    height:
      ((endMinutes - startMinutes) / 60) *
      HOUR_HEIGHT,
  };
}

export default function TimetablePage() {
  const [classes, setClasses] = useState<TimetableRow[]>([]);
  const [form, setForm] = useState<ClassForm>(INITIAL_FORM);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [pageError, setPageError] = useState("");
  const [formError, setFormError] = useState("");

  const hourLabels = useMemo(
    () =>
      Array.from(
        { length: TOTAL_HOURS + 1 },
        (_, index) => START_HOUR + index,
      ),
    [],
  );

  const loadClasses = useCallback(async () => {
    try {
      setLoading(true);
      setPageError("");

      const { data, error } = await supabase
        .from("school_timetable")
        .select("*")
        .order("day_of_week", {
          ascending: true,
        })
        .order("start_time", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      setClasses((data ?? []) as TimetableRow[]);
    } catch (error) {
      console.error("시간표 불러오기 오류:", error);
      setPageError("시간표를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  function updateForm<K extends keyof ClassForm>(
    key: K,
    value: ClassForm[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleDay(dayValue: number) {
    setForm((current) => {
      const alreadySelected =
        current.selectedDays.includes(dayValue);

      const nextDays = alreadySelected
        ? current.selectedDays.filter(
            (selectedDay) => selectedDay !== dayValue,
          )
        : [...current.selectedDays, dayValue];

      return {
        ...current,
        selectedDays: nextDays.sort((a, b) => a - b),
      };
    });

    setFormError("");
  }

  function getAutomaticColor() {
    const usedColors = new Set(classes.map((item) => item.color));

    const unusedColor = PASTEL_COLORS.find(
      (color) => !usedColors.has(color),
    );

    if (unusedColor) {
      return unusedColor;
    }

    const groupCount = new Set(
      classes.map((item) => item.course_group_id),
    ).size;

    return PASTEL_COLORS[groupCount % PASTEL_COLORS.length];
  }

  function openCreateModal(
    dayOfWeek = 1,
    startMinutes = 9 * 60,
  ) {
    const timetableStart = START_HOUR * 60;
    const timetableEnd = END_HOUR * 60;

    const safeStart = Math.min(
      Math.max(startMinutes, timetableStart),
      timetableEnd - SLOT_MINUTES,
    );

    const safeEnd = Math.min(safeStart + 90, timetableEnd);

    setForm({
      ...INITIAL_FORM,
      selectedDays: [dayOfWeek],
      startTime: minutesToTime(safeStart),
      endTime: minutesToTime(safeEnd),
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(item: TimetableRow) {
    const sameCourseRows = classes.filter(
      (classItem) =>
        classItem.course_group_id === item.course_group_id,
    );

    setForm({
      groupId: item.course_group_id,
      courseName: item.course_name,
      professor: item.professor ?? "",
      classroom: item.classroom ?? "",
      selectedDays: sameCourseRows
        .map((classItem) => classItem.day_of_week)
        .sort((a, b) => a - b),
      startTime: formatTime(item.start_time),
      endTime: formatTime(item.end_time),
      color: item.color,
    });

    setFormError("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setIsModalOpen(false);
    setForm(INITIAL_FORM);
    setFormError("");
  }

  function handleCellClick(
    dayOfWeek: number,
    slotIndex: number,
  ) {
    const startMinutes =
      START_HOUR * 60 + slotIndex * SLOT_MINUTES;

    openCreateModal(dayOfWeek, startMinutes);
  }

  function hasScheduleConflict(
    selectedDays: number[],
    startMinutes: number,
    endMinutes: number,
    ignoredGroupId: string | null,
  ) {
    return classes.some((item) => {
      if (
        ignoredGroupId &&
        item.course_group_id === ignoredGroupId
      ) {
        return false;
      }

      if (!selectedDays.includes(item.day_of_week)) {
        return false;
      }

      const existingStart = timeToMinutes(item.start_time);
      const existingEnd = timeToMinutes(item.end_time);

      return (
        startMinutes < existingEnd &&
        endMinutes > existingStart
      );
    });
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const courseName = form.courseName.trim();
    const professor = form.professor.trim();
    const classroom = form.classroom.trim();

    const startMinutes = timeToMinutes(form.startTime);
    const endMinutes = timeToMinutes(form.endTime);

    if (!courseName) {
      setFormError("과목명을 입력해주세요.");
      return;
    }

    if (form.selectedDays.length === 0) {
      setFormError("요일을 하나 이상 선택해주세요.");
      return;
    }

    if (endMinutes <= startMinutes) {
      setFormError(
        "종료 시간은 시작 시간보다 늦어야 합니다.",
      );
      return;
    }

    if (
      startMinutes < START_HOUR * 60 ||
      endMinutes > END_HOUR * 60
    ) {
      setFormError(
        `${START_HOUR}:00부터 ${END_HOUR}:00 사이로 입력해주세요.`,
      );
      return;
    }

    const conflict = hasScheduleConflict(
      form.selectedDays,
      startMinutes,
      endMinutes,
      form.groupId,
    );

    if (conflict) {
      setFormError(
        "선택한 요일 중 같은 시간에 이미 등록된 수업이 있어요.",
      );
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const groupId = form.groupId ?? createGroupId();
      const color = form.color ?? getAutomaticColor();

      if (form.groupId) {
        const { error: deleteError } = await supabase
          .from("school_timetable")
          .delete()
          .eq("course_group_id", form.groupId);

        if (deleteError) {
          throw deleteError;
        }
      }

      const rows = form.selectedDays.map((day) => ({
        course_group_id: groupId,
        course_name: courseName,
        professor: professor || null,
        classroom: classroom || null,
        day_of_week: day,
        start_time: form.startTime,
        end_time: form.endTime,
        color,
      }));

      const { error: insertError } = await supabase
        .from("school_timetable")
        .insert(rows);

      if (insertError) {
        throw insertError;
      }

      const { data: existingSubjects, error: subjectLookupError } =
        await supabase
          .from("study_subjects")
          .select("id")
          .ilike("name", courseName)
          .limit(1);

      if (subjectLookupError) {
        throw subjectLookupError;
      }

      if (!existingSubjects || existingSubjects.length === 0) {
        const now = new Date().toISOString();

        const { error: subjectInsertError } = await supabase
          .from("study_subjects")
          .insert({
            name: courseName,
            professor: professor || null,
            semester: getCurrentSemester(),
            color,
            description: null,
            created_at: now,
            updated_at: now,
          });

        if (subjectInsertError) {
          throw subjectInsertError;
        }
      }

      setIsModalOpen(false);
      setForm(INITIAL_FORM);

      await loadClasses();
    } catch (error) {
      console.error("시간표 저장 오류:", error);

      setFormError(
        "수업을 저장하지 못했습니다. Supabase 테이블 설정을 확인해주세요.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteCourseGroup() {
    if (!form.groupId) {
      return;
    }

    const target = classes.find(
      (item) => item.course_group_id === form.groupId,
    );

    if (!target) {
      return;
    }

    const selectedDayNames = classes
      .filter(
        (item) => item.course_group_id === form.groupId,
      )
      .map(
        (item) =>
          DAYS.find(
            (day) => day.value === item.day_of_week,
          )?.label,
      )
      .filter(Boolean)
      .join("·");

    const confirmed = window.confirm(
      `${target.course_name}(${selectedDayNames}) 수업을 전체 삭제할까요?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setFormError("");

      const { error } = await supabase
        .from("school_timetable")
        .delete()
        .eq("course_group_id", form.groupId);

      if (error) {
        throw error;
      }

      setIsModalOpen(false);
      setForm(INITIAL_FORM);

      await loadClasses();
    } catch (error) {
      console.error("시간표 삭제 오류:", error);
      setFormError("수업을 삭제하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black tracking-[0.16em] text-indigo-500">
              SCHOOL TIMETABLE
            </p>

            <h1 className="mt-2 text-3xl font-black text-slate-950">
              나의 시간표
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              월·수, 화·목처럼 여러 요일을 동시에
              선택할 수 있어요.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
          >
            + 수업 추가
          </button>
        </header>

        {pageError && (
          <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-600">
            {pageError}
          </div>
        )}

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[850px]">
              <div className="grid grid-cols-[72px_repeat(5,minmax(145px,1fr))] border-b border-slate-200">
                <div className="h-16 border-r border-slate-200 bg-slate-50" />

                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => openCreateModal(day.value)}
                    className="h-16 border-r border-slate-200 bg-white text-sm font-black text-slate-700 transition last:border-r-0 hover:bg-slate-50 hover:text-indigo-600"
                  >
                    {day.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-[72px_repeat(5,minmax(145px,1fr))]">
                <div
                  className="relative border-r border-slate-200 bg-slate-50"
                  style={{
                    height: TOTAL_HOURS * HOUR_HEIGHT,
                  }}
                >
                  {hourLabels.map((hour, index) => (
                    <div
                      key={hour}
                      className="absolute left-0 w-full -translate-y-1/2 pr-3 text-right text-xs font-semibold text-slate-400"
                      style={{
                        top: index * HOUR_HEIGHT,
                      }}
                    >
                      {hour}:00
                    </div>
                  ))}
                </div>

                {DAYS.map((day) => {
                  const dayClasses = classes.filter(
                    (item) =>
                      item.day_of_week === day.value,
                  );

                  return (
                    <div
                      key={day.value}
                      className="relative border-r border-slate-200 last:border-r-0"
                      style={{
                        height: TOTAL_HOURS * HOUR_HEIGHT,
                      }}
                    >
                      {Array.from({
                        length: TOTAL_HOURS * 2,
                      }).map((_, slotIndex) => (
                        <button
                          key={slotIndex}
                          type="button"
                          onClick={() =>
                            handleCellClick(
                              day.value,
                              slotIndex,
                            )
                          }
                          className={
                            slotIndex % 2 === 0
                              ? "absolute left-0 w-full border-t border-slate-200 transition hover:bg-indigo-50/50"
                              : "absolute left-0 w-full border-t border-dashed border-slate-100 transition hover:bg-indigo-50/50"
                          }
                          style={{
                            top:
                              slotIndex *
                              (HOUR_HEIGHT / 2),
                            height: HOUR_HEIGHT / 2,
                          }}
                        />
                      ))}

                      {loading && (
                        <div className="absolute inset-x-3 top-5 rounded-2xl bg-slate-100 px-3 py-4 text-center text-xs font-bold text-slate-400">
                          불러오는 중
                        </div>
                      )}

                      {!loading &&
                        dayClasses.map((item) => {
                          const position =
                            getBlockPosition(item);

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() =>
                                openEditModal(item)
                              }
                              className="absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-xl border border-white/80 px-3 py-2 text-left text-slate-800 shadow-sm transition hover:z-20 hover:scale-[1.015] hover:shadow-md"
                              style={{
                                top: position.top + 2,
                                height: Math.max(
                                  position.height - 4,
                                  34,
                                ),
                                backgroundColor: item.color,
                              }}
                              title={`${item.course_name}
${item.professor ?? ""}
${item.classroom ?? ""}
${formatTime(item.start_time)}–${formatTime(item.end_time)}
클릭하여 수정`}
                            >
                              <p className="line-clamp-2 text-sm font-black leading-5">
                                {item.course_name}
                              </p>

                              {item.classroom && (
                                <p className="mt-1 truncate text-xs font-bold text-slate-700/80">
                                  {item.classroom}
                                </p>
                              )}

                              {item.professor && (
                                <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-600/80">
                                  {item.professor}
                                </p>
                              )}

                              {position.height >= 90 && (
                                <p className="mt-1 text-[10px] font-semibold text-slate-600/70">
                                  {formatTime(
                                    item.start_time,
                                  )}
                                  –
                                  {formatTime(item.end_time)}
                                </p>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {!loading && classes.length === 0 && (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
            <p className="text-sm font-bold text-slate-600">
              아직 등록된 수업이 없어요.
            </p>

            <p className="mt-2 text-xs text-slate-400">
              빈 시간 칸을 눌러 첫 수업을 등록해보세요.
            </p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8 backdrop-blur-sm">
          <button
            type="button"
            aria-label="모달 닫기"
            onClick={closeModal}
            className="absolute inset-0"
          />

          <div className="relative z-10 max-h-full w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black tracking-[0.16em] text-indigo-500">
                  {form.groupId
                    ? "EDIT CLASS"
                    : "ADD CLASS"}
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {form.groupId
                    ? "수업 수정"
                    : "수업 추가"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg font-bold text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-7 space-y-5"
            >
              <label className="block">
                <span className="text-sm font-black text-slate-700">
                  과목명
                </span>

                <input
                  type="text"
                  value={form.courseName}
                  onChange={(event) =>
                    updateForm(
                      "courseName",
                      event.target.value,
                    )
                  }
                  placeholder="예: 개발경제학"
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    교수명
                  </span>

                  <input
                    type="text"
                    value={form.professor}
                    onChange={(event) =>
                      updateForm(
                        "professor",
                        event.target.value,
                      )
                    }
                    placeholder="선택 입력"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    강의실
                  </span>

                  <input
                    type="text"
                    value={form.classroom}
                    onChange={(event) =>
                      updateForm(
                        "classroom",
                        event.target.value,
                      )
                    }
                    placeholder="예: 본관 301"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <fieldset>
                <div className="flex items-center justify-between">
                  <legend className="text-sm font-black text-slate-700">
                    수업 요일
                  </legend>

                  <span className="text-xs font-semibold text-slate-400">
                    여러 개 선택 가능
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-5 gap-2">
                  {DAYS.map((day) => {
                    const selected =
                      form.selectedDays.includes(
                        day.value,
                      );

                    return (
                      <label
                        key={day.value}
                        className={
                          selected
                            ? "cursor-pointer rounded-xl bg-slate-900 py-3 text-center text-sm font-black text-white shadow-sm"
                            : "cursor-pointer rounded-xl border border-slate-200 bg-slate-50 py-3 text-center text-sm font-black text-slate-500 transition hover:bg-slate-100"
                        }
                      >
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() =>
                            toggleDay(day.value)
                          }
                          className="sr-only"
                        />

                        {day.label}
                      </label>
                    );
                  })}
                </div>

                {form.selectedDays.length > 0 && (
                  <p className="mt-3 text-xs font-bold text-indigo-500">
                    선택한 요일:{" "}
                    {form.selectedDays
                      .map(
                        (selectedDay) =>
                          DAYS.find(
                            (day) =>
                              day.value ===
                              selectedDay,
                          )?.label,
                      )
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                )}
              </fieldset>

              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    시작 시간
                  </span>

                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(event) =>
                      updateForm(
                        "startTime",
                        event.target.value,
                      )
                    }
                    step={1800}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-slate-700">
                    종료 시간
                  </span>

                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(event) =>
                      updateForm(
                        "endTime",
                        event.target.value,
                      )
                    }
                    step={1800}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                <p className="text-xs font-bold leading-5 text-indigo-600">
                  수업 색상은 사이트가 자동으로 지정해요.
                  같은 과목의 모든 요일에는 동일한 파스텔
                  색상이 적용됩니다.
                </p>
              </div>

              {formError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold leading-6 text-rose-600">
                  {formError}
                </div>
              )}

              <div className="flex gap-3">
                {form.groupId && (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void deleteCourseGroup()
                    }
                    className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-black text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                  >
                    삭제
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-2xl bg-slate-900 px-5 py-4 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "저장 중..."
                    : form.groupId
                      ? "수정 내용 저장"
                      : "시간표에 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}