import React, { useState } from 'react';
import { useApp, ShopItem } from '../context/AppContext';
import { Plus, Edit2, Trash2, X, ShoppingBag, Package, Users, Check, AlertCircle } from 'lucide-react';

interface ShopItemModalProps {
  onClose: () => void;
  onSave: (name: string, pts: number, stock: number, desc: string) => void;
  initial?: { name: string; requiredPoints: number; stock: number; description: string };
  title: string;
}

function ShopItemModal({ onClose, onSave, initial, title }: ShopItemModalProps) {
  const [name, setName] = useState(initial?.name || '');
  const [pts, setPts] = useState(initial?.requiredPoints?.toString() || '');
  const [unlimitedStock, setUnlimitedStock] = useState(initial ? initial.stock === -1 : false);
  const [stock, setStock] = useState(initial && initial.stock !== -1 ? initial.stock.toString() : '');
  const [desc, setDesc] = useState(initial?.description || '');

  const handleSave = () => {
    const p = parseInt(pts);
    const s = unlimitedStock ? -1 : parseInt(stock);
    if (!name.trim() || isNaN(p) || p <= 0 || (!unlimitedStock && (isNaN(s) || s < 0))) return;
    onSave(name.trim(), p, s, desc.trim());
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
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">奖励名称 *</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="如：免作业券、座位自选权..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">所需积分 *</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={pts}
                onChange={e => setPts(e.target.value)}
                placeholder="0"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
              <span className="text-sm text-gray-400">积分</span>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-2">库存设置</label>
            <div className="flex items-center gap-2 mb-2">
              <input type="checkbox" id="unlimited" checked={unlimitedStock} onChange={e => setUnlimitedStock(e.target.checked)} className="rounded" />
              <label htmlFor="unlimited" className="text-sm text-gray-600">不限库存</label>
            </div>
            {!unlimitedStock && (
              <input
                type="number"
                min="0"
                value={stock}
                onChange={e => setStock(e.target.value)}
                placeholder="库存数量"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            )}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1.5">描述（可选）</label>
            <textarea
              value={desc}
              onChange={e => setDesc(e.target.value)}
              placeholder="奖励说明..."
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
            />
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !pts || parseInt(pts) <= 0 || (!unlimitedStock && !stock)}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

interface RedeemModalProps {
  item: ShopItem;
  onClose: () => void;
}

function RedeemModal({ item, onClose }: RedeemModalProps) {
  const { students, groups, redeemItem, getGroupById } = useApp();
  const [studentId, setStudentId] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const selectedStudent = students.find(s => s.id === studentId);
  const canAfford = selectedStudent && selectedStudent.availablePoints >= item.requiredPoints;
  const remaining = item.stock === -1 ? Infinity : item.stock - item.sold;

  const handleRedeem = () => {
    if (!studentId) return;
    const res = redeemItem(studentId, item.id);
    setResult(res);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3>兑换奖励</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">
          {result ? (
            <div className="text-center py-4">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 ${result.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
                {result.success ? <Check className="w-7 h-7 text-emerald-600" /> : <AlertCircle className="w-7 h-7 text-red-600" />}
              </div>
              <p className={`font-medium mb-1 ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>{result.success ? '兑换成功！' : '兑换失败'}</p>
              <p className="text-sm text-gray-500">{result.message}</p>
              {result.success && (
                <p className="text-sm text-gray-500 mt-1">
                  {selectedStudent?.name} 剩余积分：{selectedStudent && selectedStudent.availablePoints - item.requiredPoints} 分
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Item info */}
              <div className="bg-indigo-50 rounded-xl p-4 mb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-indigo-900">{item.name}</p>
                    <p className="text-sm text-indigo-600 mt-0.5">{item.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-indigo-700">{item.requiredPoints}</p>
                    <p className="text-xs text-indigo-400">积分</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm text-gray-700 mb-1.5">选择学生 *</label>
                <select
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  <option value="">请选择学生</option>
                  {students.sort((a, b) => b.availablePoints - a.availablePoints).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.availablePoints} 分{s.availablePoints < item.requiredPoints ? ' - 积分不足' : ''})
                    </option>
                  ))}
                </select>
              </div>

              {selectedStudent && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4 ${canAfford ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {canAfford ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {canAfford
                    ? `积分充足，兑换后剩余 ${selectedStudent.availablePoints - item.requiredPoints} 分`
                    : `积分不足，还差 ${item.requiredPoints - selectedStudent.availablePoints} 分`}
                </div>
              )}
            </>
          )}
        </div>
        <div className="flex gap-2 px-6 pb-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">{result ? '关闭' : '取消'}</button>
          {!result && (
            <button
              onClick={handleRedeem}
              disabled={!studentId || !canAfford || remaining <= 0}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              确认兑换
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Shop() {
  const { shopItems, addShopItem, updateShopItem, deleteShopItem } = useApp();
  const [modal, setModal] = useState<null | 'add' | 'edit' | 'delete' | 'redeem'>(null);
  const [editing, setEditing] = useState<ShopItem | null>(null);
  const [deleting, setDeleting] = useState<ShopItem | null>(null);
  const [redeeming, setRedeeming] = useState<ShopItem | null>(null);

  const totalSold = shopItems.reduce((s, i) => s + i.sold, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-gray-900">积分商店</h1>
          <p className="text-sm text-gray-500 mt-0.5">学生可用可用积分兑换奖励</p>
        </div>
        <button onClick={() => setModal('add')} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
          <Plus className="w-4 h-4" /> 添加奖励
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-center">
          <p className="text-2xl font-semibold text-gray-900">{shopItems.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">奖励品种</p>
        </div>
        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-4 text-center">
          <p className="text-2xl font-semibold text-indigo-700">{totalSold}</p>
          <p className="text-xs text-indigo-400 mt-0.5">已兑换次数</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
          <p className="text-2xl font-semibold text-amber-700">{shopItems.filter(i => i.stock === -1 || (i.stock - i.sold) > 0).length}</p>
          <p className="text-xs text-amber-400 mt-0.5">有库存商品</p>
        </div>
      </div>

      {shopItems.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-200">
          <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">积分商店暂无商品</p>
          <p className="text-gray-400 text-xs mt-1">添加奖励商品，激励学生积极表现</p>
          <button onClick={() => setModal('add')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">
            添加第一件商品
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {shopItems.map(item => {
            const remaining = item.stock === -1 ? null : item.stock - item.sold;
            const outOfStock = remaining !== null && remaining <= 0;
            return (
              <div key={item.id} className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col ${outOfStock ? 'opacity-60' : ''}`} style={{ borderColor: outOfStock ? '#e5e7eb' : '#e0e7ff' }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-indigo-100 flex items-center justify-center text-2xl flex-shrink-0">
                    🎁
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditing(item); setModal('edit'); }} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setDeleting(item); setModal('delete'); }} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h4 className="text-gray-900 mb-1">{item.name}</h4>
                <p className="text-sm text-gray-500 flex-1 mb-3">{item.description}</p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Package className="w-3.5 h-3.5" />
                    {item.stock === -1 ? '不限库存' : `剩余 ${remaining} 件`}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    已兑换 {item.sold} 次
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-indigo-600">{item.requiredPoints}</span>
                    <span className="text-xs text-gray-400">积分</span>
                  </div>
                  <button
                    onClick={() => { setRedeeming(item); setModal('redeem'); }}
                    disabled={outOfStock}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {outOfStock ? '已售罄' : '兑换'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modal === 'add' && (
        <ShopItemModal title="添加奖励" onClose={() => setModal(null)} onSave={(name, pts, stock, desc) => addShopItem(name, pts, stock, desc)} />
      )}
      {modal === 'edit' && editing && (
        <ShopItemModal title="编辑奖励" initial={editing} onClose={() => { setModal(null); setEditing(null); }} onSave={(name, pts, stock, desc) => updateShopItem(editing.id, name, pts, stock, desc)} />
      )}
      {modal === 'redeem' && redeeming && (
        <RedeemModal item={redeeming} onClose={() => { setModal(null); setRedeeming(null); }} />
      )}
      {modal === 'delete' && deleting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="text-gray-900 mb-2">删除奖励</h3>
            <p className="text-sm text-gray-600 mb-5">确定删除「{deleting.name}」吗？此操作不可恢复。</p>
            <div className="flex gap-2">
              <button onClick={() => { setModal(null); setDeleting(null); }} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50">取消</button>
              <button onClick={() => { deleteShopItem(deleting.id); setModal(null); setDeleting(null); }} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700">确认删除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
