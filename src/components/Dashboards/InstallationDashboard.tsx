import React, { useEffect, useMemo, useState } from "react";
import { BellRing } from "lucide-react";
import { motion } from "framer-motion";

type ComingSoonProps = {
  /** Target launch date (ISO string). Example: "2025-12-01T09:00:00Z" */
  launchAt?: string;
  /** Brand name displayed in the footer */
  brand?: string;
  /** Optional tagline under the title */
  tagline?: string;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const defaultTarget = (() => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString();
})();

const ComingSoon: React.FC<ComingSoonProps> = ({
  launchAt = defaultTarget,
  brand = "Your Brand",
  tagline = "We’re crafting something awesome. Stay tuned!",
}) => {
  const launchDate = useMemo(() => new Date(launchAt), [launchAt]);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => diff(launchDate));

  useEffect(() => {
    const t = setInterval(() => {
      setTimeLeft(diff(launchDate));
    }, 1000);
    return () => clearInterval(t);
  }, [launchDate]);

  function diff(target: Date): TimeLeft {
    const now = new Date().getTime();
    const dist = target.getTime() - now;

    if (dist <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    const days = Math.floor(dist / (1000 * 60 * 60 * 24));
    const hours = Math.floor((dist / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((dist / (1000 * 60)) % 60);
    const seconds = Math.floor((dist / 1000) % 60);
    return { days, hours, minutes, seconds };
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-900 via-gray-900 to-black text-white relative overflow-hidden flex items-center justify-center px-6 sm:px-10">
      {/* Subtle gradient orbs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

      {/* Single centered block */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-3xl text-center space-y-6"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/80 mx-auto">
          <BellRing className="h-4 w-4" />
          Coming Soon
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-tight">
          Something new is on the way.
        </h1>

        <div className="grid grid-cols-4 gap-3 sm:gap-4 max-w-md mx-auto">
          <TimeCard label="Days" value={timeLeft.days} />
          <TimeCard label="Hours" value={timeLeft.hours} />
          <TimeCard label="Minutes" value={timeLeft.minutes} />
          <TimeCard label="Seconds" value={timeLeft.seconds} />
        </div>

      </motion.div>
    </div>
  );
};

const TimeCard: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const v = Math.max(0, value) | 0;
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-3 sm:p-4 text-center">
      <div className="text-2xl sm:text-3xl font-semibold tabular-nums">
        {v.toString().padStart(2, "0")}
      </div>
      <div className="text-xs sm:text-sm text-white/60">{label}</div>
    </div>
  );
};

export default ComingSoon;