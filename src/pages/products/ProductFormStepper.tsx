import { CheckLineIcon } from "@/icons";

export interface ProductFormStep {
  label: string;
}

interface ProductFormStepperProps {
  steps: ProductFormStep[];
  currentStep: number;
  maxStepReached: number;
  onStepClick: (index: number) => void;
}

export function ProductFormStepper({
  steps,
  currentStep,
  maxStepReached,
  onStepClick,
}: ProductFormStepperProps) {
  return (
    <div className="flex items-center">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isActive = index === currentStep;
        const isReachable = index <= maxStepReached;

        return (
          <div key={step.label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              disabled={!isReachable}
              onClick={() => onStepClick(index)}
              className="flex items-center gap-2.5 disabled:cursor-not-allowed"
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                  isCompleted
                    ? "bg-brand-500 text-white"
                    : isActive
                      ? "border-2 border-brand-500 text-brand-500 dark:text-brand-400"
                      : "border border-gray-300 text-gray-400 dark:border-gray-700 dark:text-gray-500"
                }`}
              >
                {isCompleted ? <CheckLineIcon className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={`text-sm font-medium ${
                  isActive
                    ? "text-gray-800 dark:text-white/90"
                    : isReachable
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-400 dark:text-gray-600"
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={`mx-4 h-px flex-1 ${
                  isCompleted ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-800"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
