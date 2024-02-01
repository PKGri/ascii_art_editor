const CONSTS = {
    GRID: {
        HEIGHT: 50,
        WIDTH: 100,
    },
    DRAW_TOOL: {
        FREE: "free",
        LINE: "line",
        RECTANGLE: "rectangle",
        ELLIPSE: "ellipse",
    },
    MOUSE_BUTTONS: {
        LMB: 0,
        RMB: 2,
    },
    EMPTY_SPACE: " ",
    BACKSPACE_KEYCODE: 8,
};

// Ако няма сесия с потребител, препрати към началната страница
const checkLogin = () => {
    fetch("checkLogin.php")
        .then((response) => response.json())
        .then((data) => {
            if (!data.logged_in) {
                window.location.href = "index.html";
            }
        })
        .catch((error) => console.error("Грешка:", error));
};

const fetchArtworks = async () => {
    const response = await fetch("getArtworksByUser.php");
    const artworks = await response.json();

    // Попълни менюто с произведения
    const dropdown = document.getElementById("artworksDropdown");
    dropdown.innerHTML = "<option value=''>Избери</option>";
    artworks.forEach((artwork) => {
        const option = document.createElement("option");
        option.value = artwork.artwork_id;
        option.text = `#${artwork.artwork_id} - ${artwork.created_at}`;
        dropdown.appendChild(option);
    });
};

const saveArtwork = async (content) => {
    const response = await fetch("saveArtwork.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            content: content,
        }),
    });
    const result = await response.json();

    if (response.ok) {
        fetchArtworks();
    } else {
        console.error(result.error || "Грешка при запазването");
    }
};

const loadArtwork = async (artworkId, cells) => {
    const response = await fetch(`getArtwork.php?artwork_id=${artworkId}`);
    const artwork = await response.json();

    if (response.ok) {
        cells.forEach((cell, index) => draw(cell, artwork.content[index]));
    } else {
        console.error(artwork.error || "Не е намерено произведение");
    }
};

// Намери индекси на клетки в правя линия
const getLineIndexes = (startCell, endCell) => {
    const result = [];

    let x0 = startCell % CONSTS.GRID.WIDTH;
    let y0 = Math.floor(startCell / CONSTS.GRID.WIDTH);
    const x1 = endCell % CONSTS.GRID.WIDTH;
    const y1 = Math.floor(endCell / CONSTS.GRID.WIDTH);

    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    while (true) {
        const index = y0 * CONSTS.GRID.WIDTH + x0;
        result.push(index);

        if (x0 === x1 && y0 === y1) {
            break;
        }

        const e2 = 2 * err;
        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }
        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }

    return result;
};

// Намери индекси на клетки в обиколка на правоъгълник
const getRectangleIndexes = (startCell, endCell) => {
    const result = [];

    const startX = startCell % CONSTS.GRID.WIDTH;
    const startY = Math.floor(startCell / CONSTS.GRID.WIDTH);
    const endX = endCell % CONSTS.GRID.WIDTH;
    const endY = Math.floor(endCell / CONSTS.GRID.WIDTH);

    const minX = Math.min(startX, endX);
    const minY = Math.min(startY, endY);
    const maxX = Math.max(startX, endX);
    const maxY = Math.max(startY, endY);

    for (let row = minY; row <= maxY; row++) {
        for (let col = minX; col <= maxX; col++) {
            // Добаване само на клетки по границата
            if (row === minY || row === maxY || col === minX || col === maxX) {
                const index = row * CONSTS.GRID.WIDTH + col;
                result.push(index);
            }
        }
    }

    return result;
};

const ellipseFormula = (dx, dy, radiusX, radiusY) => {
    return (dx * dx) / (radiusX * radiusX) + (dy * dy) / (radiusY * radiusY);
};

// Намери индекси на клетки в елипса
const getEllipseIndexes = (startCell, endCell) => {
    if (startCell > endCell) {
        [startCell, endCell] = [endCell, startCell];
    }

    if (startCell % CONSTS.GRID.WIDTH > endCell % CONSTS.GRID.WIDTH) {
        const diff =
            (startCell % CONSTS.GRID.WIDTH) - (endCell % CONSTS.GRID.WIDTH);
        startCell -= diff;
        endCell -= diff;
    }

    const result = [];

    if (startCell < 0 || endCell >= CONSTS.GRID.WIDTH * CONSTS.GRID.HEIGHT) {
        return result;
    }

    // Координати на границите
    const startX = startCell % CONSTS.GRID.WIDTH;
    const startY = Math.floor(startCell / CONSTS.GRID.WIDTH);
    const endX = endCell % CONSTS.GRID.WIDTH;
    const endY = Math.floor(endCell / CONSTS.GRID.WIDTH);

    // Параметри на елипсата
    const centerX = (startX + endX) / 2;
    const centerY = (startY + endY) / 2;
    const radiusX = Math.abs(endX - startX) / 2;
    const radiusY = Math.abs(endY - startY) / 2;

    for (let y = startY; y <= endY; y++) {
        for (let x = startX; x <= endX; x++) {
            // Добави клетки които са в елипсата
            const dx = x - centerX;
            const dy = y - centerY;
            const onEllipse = ellipseFormula(dx, dy, radiusX, radiusY) <= 1;

            if (onEllipse) {
                result.push(y * CONSTS.GRID.WIDTH + x);
            }
        }
    }

    return result;
};

// Функция за рисуване в клетка
const draw = (cell, character) => {
    cell.textContent = character;
};

document.addEventListener("DOMContentLoaded", () => {
    checkLogin();
    fetchArtworks();

    const grid = document.getElementById("grid");
    const charInput = document.getElementById("charInput");
    const clearGridBtn = document.getElementById("clearGrid");
    const replaceButton = document.getElementById("replaceButton");
    const gridToggleButton = document.getElementById("toggleGrid");
    const singleCharInputs = document.querySelectorAll(".singleCharInput");
    const saveButton = document.getElementById("saveButton");
    const loadButton = document.getElementById("loadButton");
    const importButton = document.getElementById("importButton");
    const exportButton = document.getElementById("exportButton");
    const logoutButton = document.getElementById("logoutButton");

    saveButton.addEventListener("click", () => {
        const content = getGrid();
        saveArtwork(content);
    });

    const setGrid = (importedContent) => {
        for(i = 0; i < importedContent.length; i++){
            draw(cells[i], importedContent[i])
        }
    };

    const getGrid = () => {
        return Array.from(cells).reduce(
            (accumulator, cell) => accumulator + cell.textContent,
            ""
        );
    };

    loadButton.addEventListener("click", () => {
        const selectedArtworkId =
            document.getElementById("artworksDropdown").value;
        if (selectedArtworkId) {
            loadArtwork(selectedArtworkId, cells);
        }
    });

    importButton.addEventListener("click", () => {
        const importFileInput = document.getElementById("importFile");

        if (importFileInput.files.length > 0) {
            const file = importFileInput.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                const importedContent = event.target.result.replace(/\n/g, "");

                const regex = /^([\s\S]{5000})$/;
                if (regex.test(importedContent)) {
                    setGrid(importedContent);
                } else {
                    console.error(
                        "Невалиден формат!"
                    );
                }
            };

            reader.readAsText(file);
        } else {
            console.error("Моля изберете файл!");
        }
    });

    exportButton.addEventListener("click", () => {
        const content = getGrid();

        // Вкарвам нов ред на всеки 100 символа, за да си личи каква е картината
        let formattedContent = "";
        for (let i = 0; i < content.length; i += CONSTS.GRID.WIDTH) {
            formattedContent += content.substring(i, i + CONSTS.GRID.WIDTH) + "\n";
        }

        const blob = new Blob([formattedContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "artwork.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    logoutButton.addEventListener("click", () => {
        fetch("logout.php").then((window.location.href = "index.html"));
    });

    singleCharInputs.forEach((input) => {
        // Disable Backspace
        input.addEventListener("keydown", (event) => {
            if (event.keyCode == CONSTS.BACKSPACE_KEYCODE) {
                event.preventDefault();
            }
        });

        // Курсора винаги да е на края
        input.addEventListener("click", () => {
            input.setSelectionRange(input.value.length, input.value.length);
        });

        // Замени стойността с най-скорошната буква
        input.addEventListener("input", () => {
            const content = input.value;
            if (content.length > 1) {
                input.value = content.charAt(1);
            }
        });
    });

    // Превключване на маркировката
    gridToggleButton.addEventListener("click", () => {
        cells.forEach((cell) => {
            cell.classList.toggle("noGrid");
        });
    });

    // Създаване на решетката
    for (i = 0; i < CONSTS.GRID.WIDTH * CONSTS.GRID.HEIGHT; i++) {
        const cell = document.createElement("div");
        cell.className = "cell";
        cell.textContent = CONSTS.EMPTY_SPACE;

        grid.appendChild(cell);
    }

    const cells = document.querySelectorAll(".cell");

    // Изчисти решетката
    clearGridBtn.addEventListener("click", () => {
        cells.forEach((cell) => {
            draw(cell, CONSTS.EMPTY_SPACE);
        });
    });

    // Замени всички срещания на даден символ с друг
    replaceButton.addEventListener("click", () => {
        const replaceInput = document.getElementById("replaceInput");
        const replaceWithInput = document.getElementById("replaceWithInput");

        cells.forEach((cell) => {
            if (cell.textContent === replaceInput.value) {
                draw(cell, replaceWithInput.value);
            }
        });
    });

    // Работа с мишка върху клетките
    // --------------------------------------------------------
    let editEvent = false;
    let shapeCells = { start: false, end: false };

    // 1. Клик върху клетка пуска режим на писане
    // 2. Задържане и местене с LMB е свободно рисуване
    // 3. Задържане и местене с Shift+LMB е рисуване на права линия
    // 4. Задържане и местене с RMB е рисуване на правоъгълник
    // 5. Задържане и местене с Shift+RMB е рисуване на елипса

    cells.forEach((cell, index) => {
        cell.addEventListener("contextmenu", (event) => {
            event.preventDefault();
        });

        // Бързо кликване върху клетка
        cell.addEventListener("click", () => {
            startTyping(cell);
        });

        // Кликване и задържане върху клетка
        cell.addEventListener("mousedown", (event) => {
            switch (event.button) {
                case CONSTS.MOUSE_BUTTONS.LMB:
                    if (event.shiftKey) {
                        editEvent = CONSTS.DRAW_TOOL.LINE;
                        shapeCells.start = index;
                        shapeCells.end = index;
                        draw(cell, charInput.value);
                    } else {
                        editEvent = CONSTS.DRAW_TOOL.FREE;
                        draw(cell, charInput.value);
                    }
                    break;
                case CONSTS.MOUSE_BUTTONS.RMB:
                    if (event.shiftKey) {
                        editEvent = CONSTS.DRAW_TOOL.ELLIPSE;
                        shapeCells.start = index;
                        shapeCells.end = index;
                    } else {
                        editEvent = CONSTS.DRAW_TOOL.RECTANGLE;
                        shapeCells.start = index;
                        shapeCells.end = index;
                        draw(cell, charInput.value);
                    }
                    break;
                default:
                    break;
            }
        });

        // Влизане в клетка докато е задържан бутон
        cell.addEventListener("mouseenter", () => {
            switch (editEvent) {
                case CONSTS.DRAW_TOOL.FREE:
                    draw(cell, charInput.value);
                    break;
                case CONSTS.DRAW_TOOL.LINE:
                    shapeCells.end = index;
                    break;
                case CONSTS.DRAW_TOOL.RECTANGLE:
                    shapeCells.end = index;
                    break;
                case CONSTS.DRAW_TOOL.ELLIPSE:
                    shapeCells.end = index;
                    break;
                default:
                    break;
            }
        });

        // Пускане на бутон върху клетка
        cell.addEventListener("mouseup", () => {
            switch (editEvent) {
                case CONSTS.DRAW_TOOL.FREE:
                    break;
                case CONSTS.DRAW_TOOL.LINE:
                    shapeCells.end = index;
                    const lineCells = getLineIndexes(
                        shapeCells.start,
                        shapeCells.end
                    );
                    lineCells.forEach((index) => {
                        draw(cells[index], charInput.value);
                    });
                    break;
                case CONSTS.DRAW_TOOL.RECTANGLE:
                    shapeCells.end = index;
                    const rectCells = getRectangleIndexes(
                        shapeCells.start,
                        shapeCells.end
                    );
                    rectCells.forEach((index) => {
                        draw(cells[index], charInput.value);
                    });
                    break;
                case CONSTS.DRAW_TOOL.ELLIPSE:
                    shapeCells.end = index;
                    const ellipseCells = getEllipseIndexes(
                        shapeCells.start,
                        shapeCells.end
                    );
                    ellipseCells.forEach((index) => {
                        draw(cells[index], charInput.value);
                    });
                    break;
                default:
                    break;
            }
        });
    });

    // Върни изходните стойности независимо къде в страницата е пуснат бутона на мишката
    document.addEventListener("mouseup", () => {
        editEvent = false;
        shapeCells = { start: false, end: false };
    });

    // Функция за преместването на фокуса върху следващата клетка
    const moveFocusToNextCell = (currentCell) => {
        const currentIndex = Array.from(cells).indexOf(currentCell);
        const nextIndex = currentIndex + 1;

        if (nextIndex < cells.length) {
            startTyping(cells[nextIndex]);
        }
    };

    // Фунцкия за решим на писане в клетка
    const startTyping = (cell) => {
        cell.contentEditable = "true";
        cell.focus();
        cell.addEventListener("input", (event) => {
            draw(cell, event.data);
            moveFocusToNextCell(cell);
        });
    };
});
