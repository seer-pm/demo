import { Children, ReactElement, useState } from "react";

export const Slideshow = ({ children }: { children: React.ReactNode }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = Children.toArray(children);
  return (
    <div className="w-full mx-auto h-full">
      <div className="overflow-hidden h-full">
        <div
          className="h-full flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide) => (
            <div key={(slide as ReactElement).key} className="w-full h-full flex-shrink-0">
              {slide}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center space-x-2 mt-4">
        {slides.map((slide, index) => (
          <button
            type="button"
            key={(slide as ReactElement).key}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full ${index === currentSlide ? "bg-purple-primary" : "bg-blue-medium"}`}
          ></button>
        ))}
      </div>
    </div>
  );
};
