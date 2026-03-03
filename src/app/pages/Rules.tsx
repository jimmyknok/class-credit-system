import React, { useState } from 'react';
import { useApp, PointRule } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, TrendingUp, TrendingDown } from 'lucide-react';

const ICON_OPTIONS = ['✅','🙋','📝','🤝','🏆','⭐','🎯','💡','🔥','📚','🎓','💪','🌟','👍','❤️','⏰','🔇','📋','❌','⚠️','😴','🚫'];

interface RuleModalProps {
  onClose: () => void;
  onSave: (name: string, points: number, icon: string) => void;
  initial?: { name: string; points: number; icon: string };
  title: string;
}

function RuleModal({ onClose, onSave, initial, title }: RuleModalProps) {
  const [name, setName] = useState(initial?.name || '');
  const [points, setPoints] = useState(Math.abs(initial?.points || 5).toString());
  const [isPositive, setIsPositive] = useState((initial?.points || 1) >= 0);
  const [icon, setIcon] = useState(initial?.icon || '⭐');

  const handleSave = () => {
    const pts = parseInt(points);
    if (!name.trim() || isNaN(pts) || pts <= 0) return;
    onSave(name.trim(), isPositive ? pts : -pts, icon);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3>{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Icon picker */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">选择图标</label>
            <div className="flex flex-wrap gap-2">
              {ICON_OPTIONS.map(ic => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-colors
                    ${icon === ic ? 'bg-indigo-100 ring-2 ring-indigo-400' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1.5">规则名称 *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="如：全勤、回答问题、迟到..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">积分类型</label>
            <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-3 w-fit">
              <button
                onClick={() => setIsPositive(true)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors ${isPositive ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <TrendingUp className="w-4 h-4" /> 加分
              </button>
              <button
                onClick={() => setIsPositive(false)}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm transition-colors ${!isPositive ? 'bg-red-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <TrendingDown className="w-4 h-4" /> 扣分
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-lg font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>{isPositive ? '+' : '-'}</span>
              <input
                type="number"
                min="1"
                value={points}
                onChange={e => setPoints(e.target.value)}
                className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <span className="text-sm text-gray-500">分</span>
            </div>
          </div>

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span className="text-xl">{icon}</span>
            <span className="text-sm text-gray-800">{name || '规则名称'}</span>
            <span className={`ml-auto text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
              {isPositive ? '+' : '-'}{points || '0'} 分
            </span>
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
          <button onClick={handleSave} disabled={!name.trim() || !points || parseInt(points) <= 0} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50">保存规则</button>
        </div>
      </div>
    </div>
  );
}

export default function Rules() {
  const { rules, records, addRule, updateRule, deleteRule } = useApp();
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'delete'>(null);
  const [editing, setEditing] = useState<PointRule | null>(null);
  const [deleting, setDeleting] = useState<PointRule | null>(null);

  const positiveRules = rules.filter(r => r.points > 0);
  const negativeRules = rules.filter(r => r.points < 0);

  const getUsageCount = (ruleId: string) => records.filter(r => r.ruleId === ruleId).length;

  const RuleCard = ({ rule }: { rule: PointRule }) => {
    const usage = getUsageCount(rule.id);
    const isPositive = rule.points > 0;
    return (
      <div className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 ${isPositive ? 'border-emerald-100' : 'border-red-100'}`}>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${isPositive ? 'bg-emerald-50' : 'bg-red-50'}`}>
          {rule.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800">{rule.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">已使用 {usage} 次</p>
        </div>
        <div className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? '+' : ''}{rule.points}
        </div>
        <div className="flex gap-1">
          <button onClick={() => { setEditing(rule); setModal('edit'); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => { setDeleting(rule); setModal('delete'); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">积分规则</h1>
          <p className="text-sm text-gray-500 mt-0.5">定义规则后，可在积分操作页一键套用</p>
        </div>
        <button onClick={() => setModal('add')} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> 新建规则
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-semibold text-gray-900">{rules.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">规则总数</p>
        </div>
        <div className="bg-emerald-50 rounded-xl border border-emerald-100 p-4 text-center">
          <p className="text-2xl font-semibold text-emerald-700">{positiveRules.length}</p>
          <p className="text-xs text-emerald-500 mt-0.5">加分规则</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-semibold text-red-700">{negativeRules.length}</p>
          <p className="text-xs text-red-500 mt-0.5">扣分规则</p>
        </div>
      </div>

      {rules.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 text-sm">暂无积分规则</p>
          <p className="text-gray-400 text-xs mt-1">创建规则后可在积分操作页快速套用</p>
          <button onClick={() => setModal('add')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            创建第一条规则
          </button>
        </div>
      )}

      {positiveRules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-gray-700">加分规则</h3>
          </div>
          <div className="space-y-2.5">
            {positiveRules.map(r => <RuleCard key={r.id} rule={r} />)}
          </div>
        </div>
      )}

      {negativeRules.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingDown className="w-4 h-4 text-red-600" />
            <h3 className="text-gray-700">扣分规则</h3>
          </div>
          <div className="space-y-2.5">
            {negativeRules.map(r => <RuleCard key={r.id} rule={r} />)}
          </div>
        </div>
      )}

      {/* Modals */}
      {modal === 'add' && (
        <RuleModal title="新建规则" onClose={() => setModal(null)} onSave={(name, pts, icon) => addRule(name, pts, icon)} />
      )}
      {modal === 'edit' && editing && (
        <RuleModal title="编辑规则" initial={editing} onClose={() => { setModal(null); setEditing(null); }} onSave={(name, pts, icon) => updateRule(editing.id, name, pts, icon)} />
      )}
      {modal === 'delete' && deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-gray-900 mb-2">删除规则</h3>
            <p className="text-sm text-gray-600 mb-5">确定删除规则「{deleting.name}」吗？历史使用记录将保留，但无法再套用此规则。</p>
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setDeleting(null); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={() => { deleteRule(deleting.id); setModal(null); setDeleting(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
