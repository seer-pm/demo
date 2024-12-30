interface SliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
}

export const Slider = ({ value, min = 0, max = 100, step = 1, onChange }: SliderProps) => {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="w-full max-w-md">
      <div className="flex items-center gap-4">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number.parseFloat(e.target.value))}
          className="
              w-full
              h-2
              appearance-none
              bg-gray-200
              rounded-lg
              cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-[#9747ff]
              [&::-moz-range-thumb]:w-4
              [&::-moz-range-thumb]:h-4
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-[#9747ff]
              [&::-moz-range-thumb]:border-0
              relative
            "
          style={{
            background: `linear-gradient(to right, #9747ff ${percentage}%, #E5E7EB ${percentage}%)`,
          }}
        />
      </div>
    </div>
  );
};
