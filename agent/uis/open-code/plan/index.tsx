import "./index.css";

interface PlanProps {
  toolCallId: string;
  executedPlans: string[];
  remainingPlans: string[];
}

export default function Plan(props: PlanProps) {
  return (
    <div className="flex flex-col gap-4 w-full max-w-xl p-6 border-[1px] rounded-xl border-slate-500">
      <h2 className="text-2xl font-semibold text-center mb-2">Code Plan</h2>
      <div className="grid grid-cols-2 divide-x divide-slate-300">
        <div className="flex flex-col gap-2 pr-6">
          <h3 className="text-lg font-medium mb-4 text-slate-700">
            Executed Plans
          </h3>
          {props.executedPlans.map((step, index) => (
            <p key={index} className="font-mono text-sm">
              {index + 1}. {step}
            </p>
          ))}
        </div>
        <div className="flex flex-col gap-2 pl-6">
          <h3 className="text-lg font-medium mb-4 text-slate-700">
            Remaining Plans
          </h3>
          {props.remainingPlans.map((step, index) => (
            <p key={index} className="font-mono text-sm">
              {props.executedPlans.length + index + 1}. {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
