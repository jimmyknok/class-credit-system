export default function LoadingScreen({ error }: { error?: string | null }) {
    return (
        <div className="fixed inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center gap-5 z-50">
            {error ? (
                <>
                    <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">
                        <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-800 font-semibold">连接失败</p>
                        <p className="text-sm text-gray-500 mt-1 max-w-xs">{error}</p>
                    </div>
                    <button onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
                        重试
                    </button>
                </>
            ) : (
                <>
                    <div className="relative w-14 h-14">
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
                    </div>
                    <div className="text-center">
                        <p className="text-gray-700 font-semibold">正在连接云端数据…</p>
                        <p className="text-sm text-gray-400 mt-1">班级积分管理系统</p>
                    </div>
                </>
            )}
        </div>
    );
}
