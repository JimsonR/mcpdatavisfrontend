import { Battery, BatteryLow, BatteryWarning } from "lucide-react";
import { useEffect, useState } from "react";

interface TokenUsageProps {
  totalTokens: number;
  maxTokens?: number;
  className?: string;
}

export default function TokenUsage({
  totalTokens,
  maxTokens = 128000,
  className = "",
}: TokenUsageProps) {
  const [percentage, setPercentage] = useState(0);

  useEffect(() => {
    setPercentage(Math.min((totalTokens / maxTokens) * 100, 100));
  }, [totalTokens, maxTokens]);

  const getIcon = () => {
    if (percentage >= 90)
      return <BatteryLow className="w-3 h-3 text-red-500" />;
    if (percentage >= 70)
      return <BatteryWarning className="w-3 h-3 text-yellow-500" />;
    return <Battery className="w-3 h-3 text-green-500" />;
  };

  const getColorClass = () => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(1)}M`;
    if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
    return tokens.toString();
  };

  // Check if this is a compact display (has width constraint)
  const isCompact = className.includes("w-");

  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      {getIcon()}
      <div className="flex-1 min-w-0">
        {!isCompact && (
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{formatTokens(totalTokens)} tokens</span>
            <span>{formatTokens(maxTokens)} max</span>
          </div>
        )}
        <div
          className={`w-full bg-gray-200 rounded-full ${
            isCompact ? "h-1.5" : "h-2"
          }`}
        >
          <div
            className={`${
              isCompact ? "h-1.5" : "h-2"
            } rounded-full transition-all duration-300 ${getColorClass()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div
          className={`text-xs text-gray-500 ${
            isCompact ? "text-center" : "mt-1"
          }`}
        >
          {isCompact
            ? `${formatTokens(totalTokens)}/${formatTokens(maxTokens)}`
            : `${percentage.toFixed(1)}% used`}
        </div>
      </div>
    </div>
  );
}
