import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { Play, Pause, RefreshCw, Timer, Shuffle, Users, Check } from 'lucide-react';

// ─── Countdown Timer ──────────────────────────────────────────────
function CountdownTimer() {
  const PRESETS = [1, 3, 5, 10];
  const [totalSeconds, setTotalSeconds] = useState(5 * 60);
  const [remaining, setRemaining] = useState(5 * 60);
  const [running, setRunning] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) {
            setRunning(false);
            clearInterval(intervalRef.current!);
            return 0;
          }
          return r - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current!);
    }
    return () => clearInterval(intervalRef.current!);
  }, [running]);

  const setDuration = (mins: number) => {
    setRunning(false);
    const secs = mins * 60;
    setTotalSeconds(secs);
    setRemaining(secs);
  };

  const applyCustom = () => {
    const m = parseFloat(customMinutes);
    if (!isNaN(m) && m > 0) { setDuration(m); setCustomMinutes(''); }
  };

  const reset = () => { setRunning(false); setRemaining(totalSeconds); };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = totalSeconds > 0 ? (remaining / totalSeconds) : 0;
  const isFinished = remaining === 0;
  const isLow = remaining > 0 && remaining <= 30;

  const circumference = 2 * Math.PI * 100;
  const strokeDash = circumference * progress;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h3 className="text-gray-800 flex items-center gap-2"><Timer className="w-5 h-5 text-indigo-500" /> 课堂倒计时</h3>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(m => (
          <button
            key={m}
            onClick={() => setDuration(m)}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-colors
              ${totalSeconds === m * 60 && remaining === m * 60 ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
          >
            {m} 分钟
          </button>
        ))}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={customMinutes}
            onChange={e => setCustomMinutes(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyCustom()}
            placeholder="自定义"
            className="w-24 border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button onClick={applyCustom} className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200 transition-colors">设置</button>
        </div>
      </div>

      {/* Circle timer */}
      <div className="flex flex-col items-center py-4">
        <div className="relative w-52 h-52">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 220 220">
            <circle cx="110" cy="110" r="100" fill="none" stroke="#f3f4f6" strokeWidth="12" />
            <circle
              cx="110" cy="110" r="100"
              fill="none"
              stroke={isFinished ? '#d1d5db' : isLow ? '#ef4444' : '#6366f1'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isFinished ? (
              <div className="text-center">
                <div className="text-3xl mb-1">🎉</div>
                <p className="text-sm text-gray-500">时间到！</p>
              </div>
            ) : (
              <>
                <span className={`text-5xl font-semibold tabular-nums ${isLow ? 'text-red-600' : 'text-gray-900'}`}>
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </span>
                <span className="text-xs text-gray-400 mt-1">{running ? '计时中...' : '已暂停'}</span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button
            onClick={reset}
            className="p-3 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => setRunning(r => !r)}
            disabled={isFinished && remaining === 0}
            className={`px-8 py-3 rounded-full text-white font-medium transition-colors flex items-center gap-2
              ${running ? 'bg-amber-500 hover:bg-amber-600' : 'bg-indigo-600 hover:bg-indigo-700'} disabled:opacity-50`}
          >
            {running ? <><Pause className="w-5 h-5" /> 暂停</> : <><Play className="w-5 h-5" /> 开始</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Random Picker ────────────────────────────────────────────────
function RandomPicker() {
  const { students, groups, getGroupById } = useApp();
  const [filterGroup, setFilterGroup] = useState('');
  const [count, setCount] = useState(1);
  const [picked, setPicked] = useState<typeof students>([]);
  const [spinning, setSpinning] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);

  const pool = students.filter(s => filterGroup === '' ? true : filterGroup === 'none' ? !s.groupId : s.groupId === filterGroup);

  const spin = useCallback(() => {
    if (pool.length === 0) return;
    setSpinning(true);
    setPicked([]);
    const actualCount = Math.min(count, pool.length);
    let i = 0;
    const interval = setInterval(() => {
      const rand = pool[Math.floor(Math.random() * pool.length)];
      setDisplayName(rand.name);
      i++;
      if (i >= 18) {
        clearInterval(interval);
        // Pick final unique students
        const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, actualCount);
        setDisplayName(null);
        setPicked(shuffled);
        setSpinning(false);
      }
    }, 80);
  }, [pool, count]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
      <h3 className="text-gray-800 flex items-center gap-2"><Shuffle className="w-5 h-5 text-purple-500" /> 随机点名</h3>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterGroup}
          onChange={e => { setFilterGroup(e.target.value); setPicked([]); }}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        >
          <option value="">全部学生（{students.length} 人）</option>
          <option value="none">未分组（{students.filter(s => !s.groupId).length} 人）</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}（{students.filter(s => s.groupId === g.id).length} 人）</option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 whitespace-nowrap">抽取人数:</label>
          <input
            type="number"
            min="1"
            max={pool.length || 1}
            value={count}
            onChange={e => setCount(Math.max(1, Math.min(parseInt(e.target.value) || 1, pool.length)))}
            className="w-16 border border-gray-200 rounded-lg px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-center"
          />
          <span className="text-sm text-gray-400">/ {pool.length}</span>
        </div>
      </div>

      {/* Display */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-8 min-h-48 flex flex-col items-center justify-center border border-indigo-100">
        {spinning && displayName ? (
          <div className="text-center">
            <div className="text-5xl font-bold text-indigo-700 transition-all">{displayName}</div>
            <p className="text-sm text-indigo-400 mt-2 animate-pulse">抽取中...</p>
          </div>
        ) : picked.length > 0 ? (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Check className="w-5 h-5 text-emerald-600" />
              <span className="text-sm text-emerald-700 font-medium">已抽取 {picked.length} 名学生</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {picked.map((s, i) => {
                const group = getGroupById(s.groupId || '');
                return (
                  <div key={s.id} className="flex flex-col items-center gap-1.5">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-semibold shadow-md"
                      style={{ backgroundColor: group?.color || '#6366f1' }}>
                      {s.name.slice(0, 1)}
                    </div>
                    <span className="text-sm font-medium text-gray-800">{s.name}</span>
                    {group && <span className="text-xs text-gray-400">{group.name}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="text-5xl mb-3">🎲</div>
            <p className="text-gray-500 text-sm">点击下方按钮随机点名</p>
            <p className="text-gray-400 text-xs mt-1">当前范围：{pool.length} 名学生</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={spin}
          disabled={spinning || pool.length === 0}
          className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Shuffle className="w-5 h-5" />
          {spinning ? '抽取中...' : '随机点名'}
        </button>
        {picked.length > 0 && (
          <button onClick={() => setPicked([])} className="px-4 py-3 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm">
            清除结果
          </button>
        )}
      </div>

      {pool.length === 0 && (
        <p className="text-xs text-amber-600 text-center bg-amber-50 rounded-lg px-3 py-2">当前范围内没有学生，请先添加学生或切换筛选范围</p>
      )}
    </div>
  );
}

export default function Tools() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div>
        <h1 className="text-gray-900">课堂工具</h1>
        <p className="text-sm text-gray-500 mt-0.5">倒计时与随机点名，提升课堂互动效率</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CountdownTimer />
        <RandomPicker />
      </div>
    </div>
  );
}
