document.addEventListener('DOMContentLoaded', () => {
    const newsList = document.getElementById('news-list');
    
    // Función para renderizar noticias en el DOM
    function renderNews(newsArray) {
        newsList.innerHTML = ''; // Limpiar mensaje de carga
        newsArray.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.title}</strong><br><small style="color:var(--gold)">${item.date}</small> - <small style="color:#aaa">${item.source}</small>`;
            
            // Añadir animación hover básica mediante JS
            li.addEventListener('mouseenter', () => li.style.color = '#fff');
            li.addEventListener('mouseleave', () => li.style.color = '#ddd');
            
            li.addEventListener('click', () => {
                if(item.link && item.link !== "#") {
                    window.open(item.link, '_blank');
                }
            });
            newsList.appendChild(li);
        });
    }

    // Intentar cargar el archivo feed.json generado por n8n o GitHub Actions
    fetch('feed.json')
        .then(response => {
            if (!response.ok) throw new Error("No se encontró feed.json local");
            return response.json();
        })
        .then(data => {
            // Limitar a las últimas 4 noticias para no romper el diseño
            renderNews(data.slice(0, 4));
        })
        .catch(error => {
            console.log("Cargando noticias locales de respaldo (fallback):", error);
            // Fallback a los datos de prueba si no existe feed.json o estamos en un entorno local (file://)
            const mockData = [
                { title: "El Decano prepara su aniversario 117 con sorpresas institucionales.", date: "Hace 2 horas", source: "Club Oficial", link: "#" },
                { title: "Nuevo mural 'Tigre Levanta Tu Corazón' inaugurado por los hinchas en la Curva Sur.", date: "Ayer", source: "Comunidad", link: "#" },
                { title: "Historia: La campaña invicta de 1930 y el nacimiento del mito gualdinegro.", date: "Hace 3 días", source: "Archivo Histórico", link: "#" }
            ];
            renderNews(mockData);
        });
});
