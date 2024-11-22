var currentuser; // user hiện tại, biến toàn cục

window.onload = function () {
    khoiTao();

    // autocomplete cho khung tim kiem
    autocomplete(document.getElementById('search-box'), list_products);

    // thêm tags (từ khóa) vào khung tìm kiếm
    var tags = ["Samsung", "iPhone", "Huawei", "Oppo", "Mobi"];
    for (var t of tags) addTags(t, "index.html?search=" + t);

    currentuser = getCurrentUser();
    addProductToTable(currentuser);
}

function addProductToTable(user) {
    var table = document.getElementsByClassName('listSanPham')[0];

    var s = `
        <tbody>
            <tr>
                <th>STT</th>
                <th>Sản phẩm</th>
                <th>Giá</th>
                <th>Số lượng</th>
                <th>Thành tiền</th>
                <th>Thời gian</th>
                <th>Xóa</th>
            </tr>`;

    if (!user) {
        s += `
            <tr>
                <td colspan="7"> 
                    <h1 style="color:red; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">
                        Bạn chưa đăng nhập !!
                    </h1> 
                </td>
            </tr>
        `;
        table.innerHTML = s;
        return;
    } else if (user.products.length == 0) {
        s += `
            <tr>
                <td colspan="7"> 
                    <h1 style="color:green; background-color:white; font-weight:bold; text-align:center; padding: 15px 0;">
                        Giỏ hàng trống !!
                    </h1> 
                </td>
            </tr>
        `;
        table.innerHTML = s;
        return;
    }

    var totalPrice = 0;
    for (var i = 0; i < user.products.length; i++) {
        var masp = user.products[i].ma;
        var soluongSp = user.products[i].soluong;
        var p = timKiemTheoMa(list_products, masp);
        var price = (p.promo.name == 'giareonline' ? p.promo.value : p.price);
        var thoigian = new Date(user.products[i].date).toLocaleString();
        var thanhtien = stringToNum(price) * soluongSp;

        s += `
            <tr>
                <td>` + (i + 1) + `</td>
                <td class="noPadding imgHide">
                    <a target="_blank" href="chitietsanpham.html?` + p.name.split(' ').join('-') + `" title="Xem chi tiết">
                        ` + p.name + `
                        <img src="` + p.img + `">
                    </a>
                </td>
                <td class="alignRight">` + price + ` ₫</td>
                <td class="soluong" >
                    <button onclick="giamSoLuong('` + masp + `')"><i class="fa fa-minus"></i></button>
                    <input size="1" onchange="capNhatSoLuongFromInput(this, '` + masp + `')" value=` + soluongSp + `>
                    <button onclick="tangSoLuong('` + masp + `')"><i class="fa fa-plus"></i></button>
                </td>
                <td class="alignRight">` + numToString(thanhtien) + ` ₫</td>
                <td style="text-align: center" >` + thoigian + `</td>
                <td class="noPadding"> <i class="fa fa-trash" onclick="xoaSanPhamTrongGioHang(` + i + `)"></i> </td>
            </tr>
        `;
        totalPrice += thanhtien;
    }

    s += `
            <tr style="font-weight:bold; text-align:center">
                <td colspan="4">TỔNG TIỀN: </td>
                <td class="alignRight">` + numToString(totalPrice) + ` ₫</td>
                <td class="thanhtoan" onclick="thanhToan()"> Thanh Toán </td>
                <td class="xoaHet" onclick="xoaHet()"> Xóa hết </td>
            </tr>
        </tbody>
    `;

    table.innerHTML = s;
}

function xoaSanPhamTrongGioHang(i) {
    if (window.confirm('Xác nhận hủy mua')) {
        currentuser.products.splice(i, 1);
        capNhatMoiThu();
    }
}

function thanhToan() {
    var c_user = getCurrentUser();
    if (c_user.off) {
        alert('Tài khoản của bạn hiện đang bị khóa nên không thể mua hàng!');
        addAlertBox('Tài khoản của bạn đã bị khóa bởi Admin.', '#aa0000', '#fff', 10000);
        return;
    }

    if (!currentuser.products.length) {
        addAlertBox('Không có mặt hàng nào cần thanh toán !!', '#ffb400', '#fff', 2000);
        return;
    }

    // Tạo một modal để chọn phương thức thanh toán
    var paymentMethod = confirm("Bạn muốn thanh toán bằng tiền mặt (OK)");
    if (paymentMethod) {
        // Thanh toán bằng tiền mặt
        alert("Bạn đã chọn thanh toán bằng tiền mặt.");
        processOrder();
    } else {
        // Thanh toán bằng Zalo Pay
        payWithZaloPay();
    }
}

function processOrder() {
    currentuser.donhang.push({
        "sp": currentuser.products,
        "ngaymua": new Date(),
        "tinhTrang": 'Đang chờ xử lý'
    });
    currentuser.products = [];
    capNhatMoiThu();
    addAlertBox('Các sản phẩm đã được gửi vào đơn hàng và chờ xử lý.', '#17c671', '#fff', 4000);
}

function xoaHet() {
    if (currentuser.products.length) {
        if (window.confirm('Bạn có chắc chắn muốn xóa hết sản phẩm trong giỏ !!')) {
            currentuser.products = [];
            capNhatMoiThu();
        }
    }
}

// Cập nhật số lượng lúc nhập số lượng vào input
function capNhatSoLuongFromInput(inp, masp) {
    var soLuongMoi = Number(inp.value);
    if (!soLuongMoi || soLuongMoi <= 0) soLuongMoi = 1;

    for (var p of currentuser.products) {
        if (p.ma == masp) {
            p.soluong = soLuongMoi;
        }
    }

    capNhatMoiThu();
}

function tangSoLuong(masp) {
    for (var p of currentuser.products) {
        if (p.ma == masp) {
            p.soluong++;
        }
    }

    capNhatMoiThu();
}

function giamSoLuong(masp) {
    for (var p of currentuser.products) {
        if (p.ma == masp) {
            if (p.soluong > 1) {
                p.soluong--;
            } else {
                return;
            }
        }
    }

    capNhatMoiThu();
}

function capNhatMoiThu() { // Mọi thứ
    animateCartNumber();

    // cập nhật danh sách sản phẩm trong localstorage
    setCurrentUser(currentuser);
    updateListUser(currentuser);

    // cập nhật danh sách sản phẩm ở table
    addProductToTable(currentuser);

    // Cập nhật trên header
    capNhat_ThongTin_CurrentUser();
}

function payWithZaloPay() {
    var c_user = getCurrentUser();
    
    if (!c_user.products.length) {
        alert('Không có sản phẩm nào để thanh toán!');
        return;
    }

    var orderDetails = {
        "app_id": "YOUR_APP_ID", // Thay thế với App ID của bạn
        "app_user": c_user.username, // Tên người dùng hoặc ID duy nhất của người dùng
        "amount": calculateTotalPrice(c_user.products), // Tổng số tiền thanh toán
        "description": "Thanh toán đơn hàng từ website", // Mô tả đơn hàng
        "callback_url": "https://yourcallbackurl.com", // URL gọi lại của bạn
        "items": c_user.products.map(product => {
            return {
                "item_name": product.name,
                "item_price": (product.promo.name === 'giareonline' ? product.promo.value : product.price),
                "item_quantity": product.soluong,
            };
        }),
    };

    var paymentUrl = 'https://sandbox.zalopay.vn/v001/tokens'; // URL sandbox
    fetch(paymentUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer YOUR_SECRET_KEY' // Thay thế với Secret Key của bạn
        },
        body: JSON.stringify(orderDetails),
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.code === 200) {
            window.location.href = data.data.payment_url; // Chuyển hướng đến URL thanh toán
        } else {
            alert('Có lỗi xảy ra khi tạo đơn hàng: ' + data.message);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra. Vui lòng thử lại sau.');
    });
}

function calculateTotalPrice(products) {
    return products.reduce((total, product) => {
        var price = (product.promo.name === 'giareonline' ? product.promo.value : product.price);
        return total + (stringToNum(price) * product.soluong);
    }, 0);
}
