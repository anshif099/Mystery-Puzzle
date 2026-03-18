import React, { useMemo } from "react";

const SpinWheel = ({ items = [], rotation = 0 }) => {
  // Define distinct colors for segments
  const SEGMENT_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", 
    "#FFEEAD", "#D4A5A5", "#9B59B6", "#34495E",
    "#E74C3C", "#16A085", "#F39C12", "#8E44AD",
    "#3498DB", "#E8DAEF", "#F8B739", "#5DADE2",
    "#58D68D", "#FF9999", "#FFB6C1", "#87CEEB"
  ];

  const wheelData = useMemo(() => {
    if (!items || items.length === 0) {
      return { segments: [], totalChance: 0 };
    }

    // Calculate total weight
    const totalChance = items.reduce((sum, item) => sum + (Number(item.chance) || 0), 0) || 100;

    // Build segments with angle calculations
    let runningAngle = 0;
    const segments = items.map((item, index) => {
      const angleSize = ((Number(item.chance) || 0) / totalChance) * 360;
      const midAngle = runningAngle + angleSize / 2;
      
      const segment = {
        ...item,
        index,
        startAngle: runningAngle,
        angleSize: angleSize,
        midAngle: midAngle,
        color: SEGMENT_COLORS[index % SEGMENT_COLORS.length],
        percentage: ((Number(item.chance) || 0) / totalChance) * 100,
      };

      runningAngle += angleSize;
      return segment;
    });

    return { segments, totalChance };
  }, [items]);

  // Create polygon path for a pie segment
  const createSegmentPath = (startAngle, endAngle, innerRadius = 0, outerRadius = 180) => {
    const toRad = (degrees) => (degrees * Math.PI) / 180;
    const fromX = Math.cos(toRad(startAngle));
    const fromY = Math.sin(toRad(startAngle));
    const toX = Math.cos(toRad(endAngle));
    const toY = Math.sin(toRad(endAngle));
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const outerStart = [fromX * outerRadius + 200, fromY * outerRadius + 200];
    const outerEnd = [toX * outerRadius + 200, toY * outerRadius + 200];

    let path = `M ${outerStart[0]} ${outerStart[1]}`;
    path += ` A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd[0]} ${outerEnd[1]}`;

    if (innerRadius > 0) {
      const innerEnd = [toX * innerRadius + 200, toY * innerRadius + 200];
      path += ` L ${innerEnd[0]} ${innerEnd[1]}`;

      const innerStart = [fromX * innerRadius + 200, fromY * innerRadius + 200];
      path += ` A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart[0]} ${innerStart[1]}`;
    } else {
      path += ` L 200 200`;
    }

    path += " Z";
    return path;
  };

  // Calculate image position (at edge of segment, outside the wheel)
  const calculateImagePosition = (midAngle, distance = 220) => {
    const radians = (midAngle * Math.PI) / 180;
    const x = Math.cos(radians) * distance;
    const y = Math.sin(radians) * distance;
    return { x: 200 + x, y: 200 + y };
  };

  if (!wheelData.segments || wheelData.segments.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 font-bold rounded-full">
        No Items Set
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-full drop-shadow-lg"
      style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.2))" }}
    >
      {/* Define gradient backgrounds for segments */}
      <defs>
        {wheelData.segments.map((segment) => (
          <linearGradient
            key={`grad-${segment.index}`}
            id={`grad-${segment.index}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={segment.color} stopOpacity="1" />
            <stop offset="100%" stopColor={segment.color} stopOpacity="0.85" />
          </linearGradient>
        ))}
      </defs>

      {/* Wheel segments */}
      {wheelData.segments.map((segment) => (
        <g key={`segment-${segment.index}`}>
          {/* Segment background */}
          <path
            d={createSegmentPath(
              segment.startAngle,
              segment.startAngle + segment.angleSize,
              50,
              180
            )}
            fill={`url(#grad-${segment.index})`}
            stroke="white"
            strokeWidth="2"
            opacity="0.95"
          />
        </g>
      ))}

      {/* Center circle background */}
      <circle cx="200" cy="200" r="45" fill="white" stroke="#FCD34D" strokeWidth="3" />
      <text
        x="200"
        y="208"
        textAnchor="middle"
        fill="#1F2937"
        fontSize="14"
        fontWeight="bold"
        pointerEvents="none"
      >
        SPIN
      </text>

      {/* Item images positioned on segments */}
      {wheelData.segments.map((segment) => {
        if (!segment.image) return null;

        const pos = calculateImagePosition(segment.midAngle, 120);

        return (
          <g key={`img-${segment.index}`}>
            {/* Image clip path for circular mask */}
            <defs>
              <clipPath id={`clip-${segment.index}`}>
                <circle cx={pos.x} cy={pos.y} r="20" />
              </clipPath>
            </defs>

            {/* Item image circle background */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="20"
              fill="white"
              opacity="0.95"
              filter="drop-shadow(0 2px 8px rgba(0,0,0,0.2))"
            />

            {/* Item image */}
            <image
              href={segment.image}
              x={pos.x - 20}
              y={pos.y - 20}
              width="40"
              height="40"
              clipPath={`url(#clip-${segment.index})`}
              preserveAspectRatio="xMidYMid slice"
              opacity="1"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default SpinWheel;
