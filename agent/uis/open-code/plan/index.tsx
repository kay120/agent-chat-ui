import "./index.css";

interface PlanProps {
  toolCallId: string;
  plan: string[];
}

export default function Plan(props: PlanProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xl p-4 border-[1px] rounded-xl border-slate-500">
      <p className="text-lg font-medium">Plan</p>
      <div className="flex flex-col gap-2">
        {props.plan.map((step, index) => (
          <p key={index} className="font-mono">
            {index + 1}. {step}
          </p>
        ))}
      </div>
    </div>
  );
}
