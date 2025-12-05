"use client";

import { useState, useEffect } from "react";

// Event date: December 31, 2025, 6:00 PM UTC+3
const EVENT_DATE = new Date("2025-12-31T18:00:00+03:00");

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function Countdown() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = EVENT_DATE.getTime() - now.getTime();

      if (difference > 0) {
        return {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }

      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!mounted) {
    return (
      <div className="countdown-container">
        {["Days", "Hours", "Minutes", "Seconds"].map((label) => (
          <div key={label} className="countdown-item">
            <div className="countdown-number">--</div>
            <div className="countdown-label">{label}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="text-center">
      <h2 className="text-2xl mb-4 glow-text">🎄 Time Until The Party 🎄</h2>
      <p className="text-sm mb-6 text-christmas-cream/80">
        December 31, 2025 at 6:00 PM (UTC+3)
      </p>
      <div className="countdown-container">
        <div className="countdown-item">
          <div className="countdown-number">{timeLeft.days}</div>
          <div className="countdown-label">Days</div>
        </div>
        <div className="countdown-item">
          <div className="countdown-number">{timeLeft.hours}</div>
          <div className="countdown-label">Hours</div>
        </div>
        <div className="countdown-item">
          <div className="countdown-number">{timeLeft.minutes}</div>
          <div className="countdown-label">Minutes</div>
        </div>
        <div className="countdown-item">
          <div className="countdown-number">{timeLeft.seconds}</div>
          <div className="countdown-label">Seconds</div>
        </div>
      </div>
    </div>
  );
}

