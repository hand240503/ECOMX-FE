import { Gift, Crown, ArrowRight, Ticket, ShieldCheck, RefreshCw, Star, HeadphonesIcon, BadgeCheck } from 'lucide-react';
import { useRouteLoadingNavigation } from '../../app/loading/useRouteLoadingNavigation';

const HomeRightPanel = () => {
  const { navigateWithLoading } = useRouteLoadingNavigation();

  return (
    <aside className="w-[240px] flex-shrink-0 flex flex-col justify-between h-full gap-3">

      {/* ── Thành viên VIP ── */}
      <div
        className="flex-1 rounded-xl overflow-hidden shadow-sm cursor-pointer group flex flex-col"
        onClick={() => navigateWithLoading('/register')}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 pt-3.5 pb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-yellow-300" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wide">Thành viên VIP</span>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] text-blue-200 group-hover:text-white transition-colors">
              Đăng ký <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
          <p className="text-sm font-bold text-white leading-tight">
            Tích điểm – Hoàn tiền lên đến <span className="text-yellow-300">10%</span>
          </p>
        </div>
        <div className="flex-1 bg-blue-50 border border-blue-100 border-t-0 rounded-b-xl px-3 py-2.5 flex flex-col justify-center gap-1.5">
          {[
            { icon: <Star className="h-3 w-3 text-blue-500" />,      text: 'Hoàn tiền 5–10% mỗi đơn hàng' },
            { icon: <Gift className="h-3 w-3 text-blue-500" />,      text: 'Quà tặng sinh nhật độc quyền' },
            { icon: <BadgeCheck className="h-3 w-3 text-blue-500" />,text: 'Ưu đãi sớm trước toàn bộ khách' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {b.icon}
              <span className="text-[11px] text-blue-800 font-medium">{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mã ưu đãi hôm nay ── */}
      <div
        className="flex-1 rounded-xl overflow-hidden shadow-sm cursor-pointer group flex flex-col"
        onClick={() => navigateWithLoading('/products')}
      >
        <div className="bg-gradient-to-r from-orange-500 to-amber-400 px-4 pt-3.5 pb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-white" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wide">Mã ưu đãi hôm nay</span>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] text-orange-100 group-hover:text-white transition-colors">
              Xem ngay <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
          <p className="text-sm font-bold text-white leading-tight">
            Giảm thêm đến <span className="text-yellow-200">200.000 ₫</span>
          </p>
        </div>
        <div className="flex-1 bg-orange-50 border border-orange-100 border-t-0 rounded-b-xl px-3 py-2.5 flex flex-col justify-center gap-2">
          {[
            { label: 'ĐƠN ĐẦU', text: 'Giảm ngay 150.000 ₫', color: 'bg-orange-500' },
            { label: 'SHIP 0Đ', text: 'Đơn từ 299.000 ₫',     color: 'bg-amber-500' },
            { label: 'APP',     text: 'Giảm thêm 50.000 ₫',   color: 'bg-red-500'   },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className={`${item.color} text-white text-[9px] font-bold px-1.5 py-0.5 rounded`}>
                {item.label}
              </span>
              <span className="text-[11px] font-bold text-orange-700">{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mua hàng an tâm ── */}
      <div
        className="flex-1 rounded-xl overflow-hidden shadow-sm cursor-pointer group flex flex-col"
        onClick={() => navigateWithLoading('/products')}
      >
        <div className="bg-gradient-to-r from-violet-600 to-indigo-500 px-4 pt-3.5 pb-2">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-white" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wide">Mua hàng an tâm</span>
            </div>
            <span className="flex items-center gap-0.5 text-[10px] text-violet-200 group-hover:text-white transition-colors">
              Tìm hiểu <ArrowRight className="h-2.5 w-2.5" />
            </span>
          </div>
          <p className="text-sm font-bold text-white leading-tight">
            Đổi trả dễ dàng <span className="text-yellow-300">trong 30 ngày</span>
          </p>
        </div>
        <div className="flex-1 bg-violet-50 border border-violet-100 border-t-0 rounded-b-xl px-3 py-2.5 flex flex-col justify-center gap-1.5">
          {[
            { icon: <BadgeCheck className="h-3 w-3 text-violet-500" />,      text: 'Hàng chính hãng 100%' },
            { icon: <RefreshCw className="h-3 w-3 text-violet-500" />,       text: 'Hoàn tiền nếu không hài lòng' },
            { icon: <HeadphonesIcon className="h-3 w-3 text-violet-500" />,  text: 'Hỗ trợ khách hàng 24/7' },
          ].map((b, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {b.icon}
              <span className="text-[11px] text-violet-900 font-medium">{b.text}</span>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
};

export default HomeRightPanel;
