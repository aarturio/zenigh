// Custom pulsing dot component
const PulsingDot = ({ cx, cy }) => (
  <g>
    {/* Outer pulsing circle */}
    <circle cx={cx} cy={cy} r={8} fill="teal" opacity={0.3}>
      <animate
        attributeName="r"
        values="5;15"
        dur="1s"
        repeatCount="indefinite"
      />
      <animate
        attributeName="opacity"
        values="0.5;0.1"
        dur="1s"
        repeatCount="indefinite"
      />
    </circle>
    {/* Inner solid dot */}
    <circle cx={cx} cy={cy} r={4} fill="teal" />
  </g>
);

// Custom dot component that only shows for the last point
const LastPointDot = (props) => {
  const { payload, index, totalBars } = props;
  const isLastPoint = index === totalBars - 1;

  if (isLastPoint) {
    return <PulsingDot {...props} />;
  }
  return null;
};

export default LastPointDot;
