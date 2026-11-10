import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useExamData } from "@/lib/exam/store";

export function useFinished() {
  const data = useExamData();
  const navigate = useNavigate();
  useEffect(() => { if (data.ready && data.attempt?.stage !== "done") navigate({ to: "/" }); }, [data.ready, data.attempt?.stage]);
  return data;
}
