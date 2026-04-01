/**
 * 1. KONFIGURASI URL
 * Tempel URL Web App dari Google Apps Script di sini
 */
const scriptURL = 'https://script.google.com/macros/s/AKfycbxz6sMuS8un2-CltlwVNGek0INO3tfYONVruEw5G1ApaAZT9I0wCp3RqTBagryVxTAJ/exec';

/**
 * 2. SELECTOR ELEMENT
 */
const form = document.getElementById('mitraForm');
const btnSubmit = document.getElementById('btnSubmit');
const peranSelect = document.getElementById('peran');
const labelNama = document.getElementById('label-nama');
const rowKec = document.getElementById('row-kecamatan');
const rowDesa = document.getElementById('row-desa');

const provSelect = document.getElementById('provinsi');
const kotaSelect = document.getElementById('kota');
const kecSelect = document.getElementById('kecamatan');
const desaSelect = document.getElementById('desa');

/**
 * 3. FUNGSI MODAL NOTIFIKASI KUSTOM (SETEMA UI)
 */
function showModal(title, message, type = 'success') {
    const modal = document.getElementById('customModal');
    const mTitle = document.getElementById('modalTitle');
    const mMsg = document.getElementById('modalMessage');
    const mIcon = document.getElementById('modalIcon');
    const mBtn = document.getElementById('modalBtn');

    if (!modal) {
        // Fallback jika elemen modal belum dibuat di HTML
        alert(title + "\n" + message);
        if (title === 'Registrasi Berhasil!') window.location.href = 'login_sig.html';
        return;
    }

    mTitle.innerText = title;
    mMsg.innerText = message;
    
    if (type === 'success') {
        mIcon.innerHTML = '<i class="fas fa-check-circle text-green-500"></i>';
        mTitle.className = "text-xl font-bold mb-2 text-green-500";
    } else {
        mIcon.innerHTML = '<i class="fas fa-exclamation-triangle text-red-500"></i>';
        mTitle.className = "text-xl font-bold mb-2 text-red-500";
    }

    modal.classList.remove('hidden');

    mBtn.onclick = function() {
        modal.classList.add('hidden');
        if (title === 'Registrasi Berhasil!') {
            window.location.href = 'login_sig.html';
        }
    };
}

/**
 * 4. LOGIKA INTERAKSI FORM (PERAN)
 */
if (peranSelect) {
    peranSelect.addEventListener('change', function() {
        const val = this.value;
        if (labelNama) {
            labelNama.innerText = (val === 'pabrik' || val === 'distro') ? "Nama Perusahaan / Unit Usaha" : "Nama Lengkap";
        }
        
        if (val === 'konsumen') {
            rowKec?.classList.add('hidden');
            rowDesa?.classList.add('hidden');
        } else {
            rowKec?.classList.remove('hidden');
            rowDesa?.classList.remove('hidden');
        }
    });
}

/**
 * 5. FUNGSI PENGAMBILAN DATA WILAYAH (API EMSIFA)
 */
function loadWilayah() {
    if (!provSelect) return;

    fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json')
        .then(res => res.json())
        .then(data => {
            provSelect.innerHTML = '<option value="">Pilih Provinsi...</option>';
            data.forEach(prov => {
                let opt = document.createElement('option');
                opt.value = prov.id;
                opt.text = prov.name;
                provSelect.add(opt);
            });
        })
        .catch(err => console.error("Gagal memuat provinsi:", err));

    provSelect.addEventListener('change', () => {
        const idProv = provSelect.value;
        if (!idProv) return;

        kotaSelect.innerHTML = '<option value="">Memuat Kota...</option>';
        kotaSelect.disabled = true;
        kecSelect.innerHTML = '<option value="">Pilih Kecamatan...</option>';
        kecSelect.disabled = true;
        desaSelect.innerHTML = '<option value="">Pilih Desa...</option>';
        desaSelect.disabled = true;

        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${idProv}.json`)
            .then(res => res.json())
            .then(data => {
                kotaSelect.disabled = false;
                kotaSelect.innerHTML = '<option value="">Pilih Kota...</option>';
                data.forEach(reg => {
                    let opt = document.createElement('option');
                    opt.value = reg.id;
                    opt.text = reg.name;
                    kotaSelect.add(opt);
                });
            });
    });

    kotaSelect.addEventListener('change', () => {
        const idKota = kotaSelect.value;
        if (!idKota) return;
        kecSelect.innerHTML = '<option value="">Memuat Kecamatan...</option>';
        kecSelect.disabled = true;
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${idKota}.json`)
            .then(res => res.json())
            .then(data => {
                kecSelect.disabled = false;
                kecSelect.innerHTML = '<option value="">Pilih Kecamatan...</option>';
                data.forEach(dist => {
                    let opt = document.createElement('option');
                    opt.value = dist.id;
                    opt.text = dist.name;
                    kecSelect.add(opt);
                });
            });
    });

    kecSelect.addEventListener('change', () => {
        const idKec = kecSelect.value;
        if (!idKec) return;
        desaSelect.innerHTML = '<option value="">Memuat Desa...</option>';
        desaSelect.disabled = true;
        fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${idKec}.json`)
            .then(res => res.json())
            .then(data => {
                desaSelect.disabled = false;
                desaSelect.innerHTML = '<option value="">Pilih Desa...</option>';
                data.forEach(v => {
                    let opt = document.createElement('option');
                    opt.value = v.id;
                    opt.text = v.name;
                    desaSelect.add(opt);
                });
            });
    });
}

/**
 * 6. KIRIM DATA KE GOOGLE SHEETS
 */
if (form) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        
        if (!provSelect.value || !kotaSelect.value) {
            showModal('Peringatan', 'Harap pilih Provinsi dan Kota/Kabupaten.', 'error');
            return;
        }

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Memproses...';

        const formData = new FormData(form);
        formData.append('provinsi_name', provSelect.options[provSelect.selectedIndex].text);
        formData.append('kota_name', kotaSelect.options[kotaSelect.selectedIndex].text);
        
        if (peranSelect.value !== 'konsumen' && kecSelect.selectedIndex > 0) {
            formData.append('kecamatan_name', kecSelect.options[kecSelect.selectedIndex].text);
            formData.append('desa_name', desaSelect.options[desaSelect.selectedIndex].text);
        }

        fetch(scriptURL, { method: 'POST', body: formData })
            .then(response => response.json())
            .then(data => {
                if (data.result === "success") {
                    showModal('Registrasi Berhasil!', 'Akun Anda telah tersimpan. Silakan login untuk masuk ke dasbor.', 'success');
                } else {
                    showModal('Email Sudah Terdaftar', data.message || 'Email sudah terdaftar!', 'error');
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fas fa-paper-plane mr-2"></i> Konfirmasi Pendaftaran';
                }
            })
            .catch(error => {
                console.error('Error!', error.message);
                showModal('Error Koneksi', 'Gagal terhubung ke server. Periksa internet atau URL Script.', 'error');
                btnSubmit.disabled = false;
                btnSubmit.innerHTML = 'Coba Lagi';
            });
    });
}

document.addEventListener('DOMContentLoaded', loadWilayah);