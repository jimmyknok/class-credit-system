import React from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Users, Star, TrendingUp, Award, Plus, Shuffle, Timer, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

export default function Dashboard() {
  const { students, groups, records, rules, shopItems, getGroupById, getStudentById } = useApp();
  const navigate = useNavigate();

  const totalStudents = students.length;
  const avgPoints = totalStudents > 0 ? Math.round(students.reduce((s, st) => s + st.totalPoints, 0) / totalStudents) : 0;
  const maxPoints = students.reduce((m, s) => Math.max(m, s.totalPoints), 0);
  const topStudent = students.find(s => s.totalPoints === maxPoints);
  const recentRecords = [...records].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);

  const topStudents = [...students].sort((a, b) => b.totalPoints - a.totalPoints).slice(0, 8).map(s => ({
    name: s.name,
    points: s.totalPoints,
    group: getGroupById(s.groupId || '') || null,
  }));

  const groupStats = groups.map(g => {
    const members = students.filter(s => s.groupId === g.id);
    const total = members.reduce((s, m) => s + m.totalPoints, 0);
    return { name: g.name, points: total, color: g.color, count: members.length };
  }).sort((a, b) => b.points - a.points);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // ── 环比增长量计算 ──
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1).toISOString(); // exclusive

  const earnByStudent = (from: string, to: string) => {
    const map: Record<string, number> = {};
    records.forEach(r => {
      if (r.type === 'earn' && r.createdAt >= from && r.createdAt < to) {
        map[r.studentId] = (map[r.studentId] || 0) + r.points;
      }
    });
    return map;
  };

  const thisMonthEarn = earnByStudent(thisMonthStart, new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString());
  const lastMonthEarn = earnByStudent(lastMonthStart, lastMonthEnd);

  const growthTop5 = students
    .map(s => ({
      name: s.name,
      groupColor: getGroupById(s.groupId || '')?.color || '#9ca3af',
      thisMonth: thisMonthEarn[s.id] || 0,
      lastMonth: lastMonthEarn[s.id] || 0,
      growth: (thisMonthEarn[s.id] || 0) - (lastMonthEarn[s.id] || 0),
    }))
    .sort((a, b) => b.growth - a.growth)
    .slice(0, 5);

  const maxGrowth = Math.max(...growthTop5.map(s => Math.abs(s.growth)), 1);
  const thisMonthLabel = `${now.getMonth() + 1}月`;
  const lastMonthLabel = `${now.getMonth() === 0 ? 12 : now.getMonth()}月`;

  // ── 本月规则统计 ──
  const thisMonthNextStart = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  const ruleStatMap: Record<string, { ruleId: string; total: number; count: number; type: 'earn' | 'deduct' }> = {};
  records.forEach(r => {
    if (!r.ruleId) return;
    if (r.createdAt < thisMonthStart || r.createdAt >= thisMonthNextStart) return;
    if (r.type !== 'earn' && r.type !== 'deduct') return;
    if (!ruleStatMap[r.ruleId]) ruleStatMap[r.ruleId] = { ruleId: r.ruleId, total: 0, count: 0, type: r.type };
    ruleStatMap[r.ruleId].total += r.points;
    ruleStatMap[r.ruleId].count += 1;
  });
  const ruleStatList = Object.values(ruleStatMap).map(stat => {
    const rule = rules.find(rl => rl.id === stat.ruleId);
    return { ...stat, name: rule?.name || '未知规则', icon: rule?.icon || '📌' };
  });
  const topEarnRules = [...ruleStatList].filter(r => r.type === 'earn').sort((a, b) => b.total - a.total).slice(0, 5);
  const topDeductRules = [...ruleStatList].filter(r => r.type === 'deduct').sort((a, b) => b.total - a.total).slice(0, 5);
  const maxEarn = Math.max(...topEarnRules.map(r => r.total), 1);
  const maxDeduct = Math.max(...topDeductRules.map(r => r.total), 1);

  const typeLabel = (type: string) => ({ earn: '加分', deduct: '扣分', redeem: '兑换' }[type] || type);
  const typeColor = (type: string) => ({ earn: 'text-emerald-600 bg-emerald-50', deduct: 'text-red-600 bg-red-50', redeem: 'text-purple-600 bg-purple-50' }[type] || '');
  const typeSign = (type: string, pts: number) => type === 'earn' ? `+${pts}` : `-${pts}`;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">总览</h1>
          <p className="text-sm text-gray-500 mt-0.5">班级积分数据一览</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/points')} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" /> 积分操作
          </button>
          <button onClick={() => navigate('/tools')} className="flex items-center gap-1.5 px-3 py-2 bg-white text-gray-700 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 transition-colors">
            <Shuffle className="w-4 h-4" /> 课堂工具
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '学生总数', value: totalStudents, sub: `${groups.length} 个小组`, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: '平均积分', value: avgPoints, sub: '历史累计', icon: Star, color: 'bg-indigo-50 text-indigo-600' },
          { label: '最高积分', value: maxPoints, sub: topStudent?.name || '-', icon: Award, color: 'bg-amber-50 text-amber-600' },
          { label: '总记录数', value: records.length, sub: `${shopItems.reduce((s, i) => s + i.sold, 0)} 次兑换`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Students Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-900">积分排行榜</h3>
            <button onClick={() => navigate('/students')} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
              查看全部 <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topStudents} layout="vertical" margin={{ left: 8, right: 20, top: 0, bottom: 0 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#4b5563' }} axisLine={false} tickLine={false} width={40} />
              <Tooltip
                formatter={(val: number) => [`${val} 分`, '总积分']}
                contentStyle={{ border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.1)', borderRadius: '8px', fontSize: 12 }}
              />
              <Bar dataKey="points" radius={[0, 4, 4, 0]} barSize={18}>
                {topStudents.map((_, i) => (
                  <Cell key={i} fill={COLORS[Math.min(i, COLORS.length - 1)]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Group Ranking */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-gray-900 mb-4">小组排行</h3>
          <div className="space-y-3">
            {groupStats.length === 0 && <p className="text-sm text-gray-400 text-center py-4">暂无小组数据</p>}
            {groupStats.map((g, i) => (
              <div key={g.name} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0`}
                  style={{ backgroundColor: g.color }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700 truncate">{g.name}</span>
                    <span className="text-sm font-medium text-gray-900">{g.points}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${groupStats[0].points > 0 ? (g.points / groupStats[0].points) * 100 : 0}%`, backgroundColor: g.color }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{g.count} 名成员</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/groups')} className="mt-4 w-full text-xs text-center text-indigo-600 hover:text-indigo-700">
            管理小组 <ArrowRight className="w-3 h-3 inline" />
          </button>
        </div>
      </div>

      {/* 环比增长量 Top 5 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-emerald-500" />
            积分增长榜
          </h3>
          <span className="text-xs text-gray-400">{lastMonthLabel} → {thisMonthLabel} 环比</span>
        </div>
        <p className="text-xs text-gray-400 mb-4">仅统计加分记录，环比增长量 = 本月获得 − 上月获得</p>

        {growthTop5.every(s => s.growth === 0 && s.thisMonth === 0 && s.lastMonth === 0) ? (
          <p className="text-sm text-gray-400 text-center py-6">暂无本月或上月积分记录</p>
        ) : (
          <div className="space-y-3">
            {growthTop5.map((s, i) => {
              const rankEmoji = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i];
              const isPositive = s.growth >= 0;
              const barWidth = `${(Math.abs(s.growth) / maxGrowth) * 100}%`;
              const barColor = i === 0 ? '#f59e0b' : isPositive ? '#6366f1' : '#ef4444';
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <span className="text-base w-7 flex-shrink-0 text-center">{rankEmoji}</span>
                  <div className="flex items-center gap-2 w-24 flex-shrink-0">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0"
                      style={{ backgroundColor: s.groupColor }}>
                      {s.name.slice(0, 1)}
                    </div>
                    <span className="text-sm text-gray-800 truncate">{s.name}</span>
                  </div>
                  <div className="flex-1 relative">
                    <div className="h-5 bg-gray-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: barWidth, backgroundColor: barColor, opacity: 0.85 }}
                      />
                    </div>
                  </div>
                  <div className="w-28 flex-shrink-0 text-right">
                    <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{s.growth}
                    </span>
                    <span className="text-xs text-gray-400 ml-1">分</span>
                    <span className="text-xs text-gray-300 ml-2">({s.lastMonth}→{s.thisMonth})</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 本月规则排行 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 加分规则 Top 5 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-gray-900 flex items-center gap-2">
              <span className="text-base">🏆</span> 加分规则榜
            </h3>
            <span className="text-xs text-gray-400">{thisMonthLabel}</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">本月被使用次数最多的加分规则</p>
          {topEarnRules.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">本月暂无加分记录</p>
          ) : (
            <div className="space-y-3">
              {topEarnRules.map((r, i) => (
                <div key={r.ruleId} className="flex items-center gap-3">
                  <span className="text-sm w-5 text-center font-semibold text-gray-400">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <span className="text-base w-6 text-center">{r.icon}</span>
                  <span className="text-sm text-gray-800 w-20 truncate">{r.name}</span>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-400 transition-all"
                        style={{ width: `${(r.total / maxEarn) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right w-20 flex-shrink-0">
                    <span className="text-sm font-semibold text-emerald-600">+{r.total}</span>
                    <span className="text-xs text-gray-400 ml-1">分</span>
                    <span className="block text-xs text-gray-300">{r.count} 次</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 减分规则 Top 5 */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-gray-900 flex items-center gap-2">
              <span className="text-base">⚠️</span> 扣分规则榜
            </h3>
            <span className="text-xs text-gray-400">{thisMonthLabel}</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">本月被使用次数最多的扣分规则</p>
          {topDeductRules.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">本月暂无扣分记录</p>
          ) : (
            <div className="space-y-3">
              {topDeductRules.map((r, i) => (
                <div key={r.ruleId} className="flex items-center gap-3">
                  <span className="text-sm w-5 text-center font-semibold text-gray-400">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </span>
                  <span className="text-base w-6 text-center">{r.icon}</span>
                  <span className="text-sm text-gray-800 w-20 truncate">{r.name}</span>
                  <div className="flex-1">
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red-400 transition-all"
                        style={{ width: `${(r.total / maxDeduct) * 100}%` }} />
                    </div>
                  </div>
                  <div className="text-right w-20 flex-shrink-0">
                    <span className="text-sm font-semibold text-red-500">-{r.total}</span>
                    <span className="text-xs text-gray-400 ml-1">分</span>
                    <span className="block text-xs text-gray-300">{r.count} 次</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900">最新记录</h3>
          <button onClick={() => navigate('/records')} className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
            查看全部 <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        {recentRecords.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">暂无积分记录</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentRecords.map(rec => {
              const student = getStudentById(rec.studentId);
              return (
                <div key={rec.id} className="flex items-center gap-3 py-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700 flex-shrink-0">
                    {student?.name.slice(0, 1) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800">{student?.name || '未知学生'} · {rec.reason}</p>
                    <p className="text-xs text-gray-400">{formatDate(rec.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor(rec.type)}`}>{typeLabel(rec.type)}</span>
                    <span className={`text-sm font-semibold ${rec.type === 'earn' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {typeSign(rec.type, rec.points)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '加减积分', icon: Star, to: '/points', color: 'bg-indigo-600 hover:bg-indigo-700 text-white' },
          { label: '随机点名', icon: Shuffle, to: '/tools', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
          { label: '课堂计时', icon: Timer, to: '/tools', color: 'bg-amber-500 hover:bg-amber-600 text-white' },
          { label: '积分商店', icon: Award, to: '/shop', color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
        ].map(a => (
          <button key={a.label} onClick={() => navigate(a.to)}
            className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm transition-colors ${a.color}`}>
            <a.icon className="w-4 h-4" /> {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}