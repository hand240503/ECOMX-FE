const customerSupportLinks = [
  'Trung tam ho tro',
  'Huong dan dat hang',
  'Phuong thuc van chuyen',
  'Chinh sach kiem hang'
];

const aboutLinks = [
  'Gioi thieu ECOMX',
  'Tuyen dung',
  'Dieu khoan su dung',
  'Chinh sach bao mat'
];

const policyLinks = [
  'Chinh sach doi tra',
  'Chinh sach bao hanh',
  'Phuong thuc thanh toan',
  'Giai quyet khieu nai'
];

const utilityLinks = [
  'Uu dai the, vi',
  'Mua truoc tra sau',
  'Ban hang cung ECOMX',
  'Tiep thi lien ket'
];

const MainFooter = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-6">
      <div className="w-full max-w-[1392px] mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Ho tro khach hang</h4>
            <p className="text-sm text-gray-600">Hotline: 1900-0000 (8:00 - 21:00)</p>
            <p className="text-sm text-gray-600 mb-3">Email: hotro@ecomx.vn</p>
            <ul className="space-y-2">
              {customerSupportLinks.map((item) => (
                <li key={item}>
                  <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Ve ECOMX</h4>
            <ul className="space-y-2">
              {aboutLinks.map((item) => (
                <li key={item}>
                  <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Chinh sach mua hang</h4>
            <ul className="space-y-2">
              {policyLinks.map((item) => (
                <li key={item}>
                  <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Tien ich</h4>
            <ul className="space-y-2">
              {utilityLinks.map((item) => (
                <li key={item}>
                  <button className="text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-500 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <span>© {new Date().getFullYear()} ECOMX. All rights reserved.</span>
          <span>Cong ty TNHH ECOMX Viet Nam</span>
        </div>
      </div>
    </footer>
  );
};

export default MainFooter;
