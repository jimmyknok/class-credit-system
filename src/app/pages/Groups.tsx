import React, { useState } from 'react';
import { useApp, Group } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, Users, Trophy } from 'lucide-react';

const COLOR_PRESETS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#14b8a6', '#84cc16'];

interface GroupModalProps {
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  initial?: { name: string; color: string };
  title: string;
}

function GroupModal({ onClose, onSave, initial, title }: GroupModalProps) {
  const [name, setName] = useState(initial?.name || '');
  const [color, setColor] = useState(initial?.color || '#6366f1');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), color);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">小组名称 *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="如：四大天王、精英组..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">小组颜色</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? `3px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
              <span className="text-sm text-gray-500">自定义颜色: {color}</span>
            </div>
          </div>
          {/* Preview */}
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: color }}>
              {name ? name.slice(0, 1) : '组'}
            </div>
            <span className="text-sm text-gray-700">{name || '小组名称预览'}</span>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: color }}>
              {name || '预览'}
            </span>
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
          <button onClick={handleSave} disabled={!name.trim()} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">保存</button>
        </div>
      </div>
    </div>
  );
}

export default function Groups() {
  const { groups, students, records, addGroup, updateGroup, deleteGroup, getGroupTotalPoints } = useApp();
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'delete'>(null);
  const [editing, setEditing] = useState<Group | null>(null);
  const [deleting, setDeleting] = useState<Group | null>(null);

  const groupStats = groups.map(g => {
    const members = students.filter(s => s.groupId === g.id);
    const totalPoints = getGroupTotalPoints(g.id);
    const avgPoints = members.length > 0 ? Math.round(totalPoints / members.length) : 0;
    return { ...g, members, totalPoints, avgPoints };
  }).sort((a, b) => b.totalPoints - a.totalPoints);

  const maxPoints = Math.max(...groupStats.map(g => g.totalPoints), 1);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">小组管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {groups.length} 个小组 · {students.filter(s => !s.groupId).length} 名未分组</p>
        </div>
        <button onClick={() => setModal('add')} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> 新建小组
        </button>
      </div>

      {/* Group Ranking */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
        <h3 className="text-gray-800 mb-4 flex items-center gap-2"><Trophy className="w-4.5 h-4.5 text-amber-500" /> 小组积分排行</h3>
        {groupStats.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">暂无小组，请先创建小组</p>
        ) : (
          <div className="space-y-3">
            {groupStats.map((g, i) => (
              <div key={g.id} className="flex items-center gap-4">
                <div className="w-7 text-center">
                  <span className="text-sm font-semibold text-gray-500">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0" style={{ backgroundColor: g.color }}>
                  {g.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-800">{g.name}</span>
                    <div className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{g.totalPoints}</span> 分 · 均 {g.avgPoints} 分
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(g.totalPoints / maxPoints) * 100}%`, backgroundColor: g.color }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{g.members.length} 名成员</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Group Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groupStats.map(g => (
          <div key={g.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-semibold" style={{ backgroundColor: g.color }}>
                  {g.name.slice(0, 1)}
                </div>
                <div>
                  <h4 className="text-gray-900">{g.name}</h4>
                  <p className="text-xs text-gray-400">{g.members.length} 名成员</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => { setEditing(g); setModal('edit'); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => { setDeleting(g); setModal('delete'); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">总积分</p>
                <p className="text-lg font-semibold text-gray-900">{g.totalPoints}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-0.5">人均积分</p>
                <p className="text-lg font-semibold text-gray-900">{g.avgPoints}</p>
              </div>
            </div>

            {/* Members */}
            <div>
              <p className="text-xs text-gray-500 mb-2 flex items-center gap-1"><Users className="w-3 h-3" /> 成员列表</p>
              {g.members.length === 0 ? (
                <p className="text-xs text-gray-400 italic">暂无成员</p>
              ) : (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {g.members.sort((a, b) => b.totalPoints - a.totalPoints).map(m => (
                    <div key={m.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs" style={{ backgroundColor: g.color }}>
                          {m.name.slice(0, 1)}
                        </div>
                        <span className="text-xs text-gray-700">{m.name}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-600">{m.totalPoints} 分</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Ungrouped */}
        {students.filter(s => !s.groupId).length > 0 && (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h4 className="text-gray-500">未分组</h4>
                <p className="text-xs text-gray-400">{students.filter(s => !s.groupId).length} 名成员</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center py-3 bg-gray-50 rounded-lg">
              前往「学生管理」→ 筛选「未分组」→ 批量指派小组
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal === 'add' && (
        <GroupModal title="新建小组" onClose={() => setModal(null)} onSave={(name, color) => addGroup(name, color)} />
      )}
      {modal === 'edit' && editing && (
        <GroupModal title="编辑小组" initial={editing} onClose={() => { setModal(null); setEditing(null); }} onSave={(name, color) => updateGroup(editing.id, name, color)} />
      )}
      {modal === 'delete' && deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-gray-900 mb-2">删除小组</h3>
            <p className="text-sm text-gray-600 mb-1">确定删除「{deleting.name}」小组吗？</p>
            <p className="text-sm text-amber-600 mb-5">该小组的成员将变为"未分组"状态。</p>
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setDeleting(null); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={() => { deleteGroup(deleting.id); setModal(null); setDeleting(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
