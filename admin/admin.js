import { db, storage, auth } from '../js/firebase-config.js';
import { productos } from '../js/productos.js';
import { collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Check Authentication
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = 'login.html';
    }
});

// DOM Elements
const productForm = document.getElementById('product-form');
const migrateBtn = document.getElementById('migrate-btn');
const logoutBtn = document.getElementById('logout-btn');
const productList = document.getElementById('admin-product-list');
const imageInput = document.getElementById('image');
const imagePreview = document.getElementById('image-preview');
const fileText = document.querySelector('.file-text');

// Logout Logic
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = 'login.html';
        });
    });
}

// Preview image before upload
imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        fileText.innerText = file.name;
        const reader = new FileReader();
        reader.onload = (e) => {
            imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
});

// Load products in real-time
const q = query(collection(db, "productos"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    productList.innerHTML = '';
    snapshot.forEach((doc) => {
        const product = doc.data();
        const id = doc.id;
        renderAdminProduct(id, product);
    });
    if (snapshot.empty) {
        productList.innerHTML = '<p class="loader">No hay productos en el inventario.</p>';
    }
});

function renderAdminProduct(id, product) {
    const div = document.createElement('div');
    div.className = 'admin-product-item';
    div.innerHTML = `
        ${product.image ? `<img src="${product.image}" alt="${product.title}">` : `<i class="${product.icon || 'fas fa-box'}"></i>`}
        <div class="item-info">
            <h4>${product.title}</h4>
            <p>${product.category} | ${product.price}</p>
        </div>
        <div class="item-actions">
            <button class="btn-delete" onclick="deleteProduct('${id}', '${product.imagePath || ''}')">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `;
    productList.appendChild(div);
}

// Handle Form Submission
productForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
    submitBtn.disabled = true;

    const title = document.getElementById('title').value;
    const price = document.getElementById('price').value;
    const category = document.getElementById('category').value;
    const imageFile = imageInput.files[0];

    try {
        let imageUrl = '';
        let imagePath = '';

        if (imageFile) {
            imagePath = `products/${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, imagePath);
            await uploadBytes(storageRef, imageFile);
            imageUrl = await getDownloadURL(storageRef);
        }

        await addDoc(collection(db, "productos"), {
            title,
            price,
            category,
            image: imageUrl,
            imagePath: imagePath,
            createdAt: serverTimestamp()
        });

        productForm.reset();
        imagePreview.innerHTML = '';
        fileText.innerText = 'Seleccionar imagen...';
        alert('Producto guardado con éxito');
    } catch (error) {
        console.error("Error al guardar:", error);
        alert('Error al guardar el producto: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
});

// Delete Product
window.deleteProduct = async (id, imagePath) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
        try {
            await deleteDoc(doc(db, "productos", id));
            if (imagePath) {
                const imageRef = ref(storage, imagePath);
                await deleteObject(imageRef).catch(err => console.log("La imagen ya no existía en Storage"));
            }
        } catch (error) {
            console.error("Error al eliminar:", error);
            alert("Error al eliminar el producto");
        }
    }
};

// Migration Logic
if (migrateBtn) {
    migrateBtn.addEventListener('click', async () => {
        if (confirm('¿Quieres migrar los productos actuales a la base de datos en la nube?')) {
            migrateBtn.disabled = true;
            migrateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Migrando...';
            try {
                for (const prod of productos) {
                    await addDoc(collection(db, "productos"), {
                        title: prod.title,
                        price: prod.price,
                        category: prod.category,
                        image: prod.image || '',
                        icon: prod.icon || '',
                        createdAt: serverTimestamp()
                    });
                }
                alert('¡Migración exitosa! Ya puedes borrar el archivo productos.js si deseas.');
                migrateBtn.style.display = 'none';
            } catch (error) {
                console.error(error);
                alert('Error en la migración');
            }
        }
    });
}
