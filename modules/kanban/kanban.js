import { AppDatabase, Stack } from "../../core/db.js";
let db = new AppDatabase();

let currentColumnStatus = null; // Status of the column where the task is being created

let add_task_overlay = document.querySelector(".add_task_modal_overlay");
let appRoot = document.querySelector(".app_root"); 

let taskTitle = document.getElementById("add_task_title");
let taskDesc = document.getElementById("add_task_description");

let cancelToAddBtn = document.querySelector(".cancel_to_add_task_btn");
let confirmToAddBtn = document.querySelector(".confirm_to_add_task_btn");
let dependenciesList = document.querySelector(".dependencies_list"); 

let currentEditingTaskId = null; // ID of the task currently being edited

let editTaskOverlay = document.querySelector(".edit_task_overlay");
let editTitleInput = document.getElementById("edit_task_title");
let editDescInput = document.getElementById("edit_task_desc");
let editDependList = document.getElementById("edit_dependencies_list");

let errorBox = document.getElementById("cycle_error_msg"); // Error message container for circular dependencies

let columnTasks = document.querySelectorAll(".column_tasks");

// Task drag-and-drop implementation
appRoot.addEventListener("dragstart", (event) => {
    let draggableCard = event.target.closest(".task_card");
    if (!draggableCard) return; 

    event.dataTransfer.setData("text/plain", draggableCard.dataset.id);

    setTimeout(() => {
        draggableCard.classList.add("dragging");
    }, 0);
});

appRoot.addEventListener("dragend", (event) => {
    let draggableCard = event.target.closest(".task_card");
    if (draggableCard) {
        draggableCard.classList.remove("dragging");
    }
});

appRoot.addEventListener("dragover", (event) => {
    let column = event.target.closest(".kanban_column");
    if (column) {
        event.preventDefault();
        column.classList.add("drag_over");
    }
});

appRoot.addEventListener("dragleave", (event) => {
    let column = event.target.closest(".kanban_column");
    if (column) {
        column.classList.remove("drag_over");
    }
});

appRoot.addEventListener("drop", async (event) => {
    event.preventDefault();
    let column = event.target.closest(".kanban_column");

    if (!column) return; 

    column.classList.remove("drag_over");

    let newStatus = column.dataset.status;
    let taskId = event.dataTransfer.getData("text/plain");
    
    if (!taskId) return;

    let task = await db.get("tasks", taskId);
    

    if (task.status === newStatus) return;

    task.status = newStatus;
    await db.update("tasks", task);
    renderKanbanBoard();
});


editDependList.addEventListener("change", () => {
    if (errorBox) {
        errorBox.style.display = "none";
    }
});

// Depth-First Search (DFS) to detect and prevent circular dependencies
async function getCyclePath(targetTaskId, newDepIds) {
    let stack = new Stack();
    let visited = new Set();
    let pathMap = {};
    let targetTask = await db.get("tasks", targetTaskId);

    newDepIds.forEach(id => {
        stack.push(id);
        pathMap[id] = [targetTask.title]; 
    });

    while (!stack.isEmpty()) {
        let currentId = stack.pop();
        let currentTask = await db.get("tasks", currentId);
        
        if (!currentTask) continue;

        let currentPath = [...pathMap[currentId], currentTask.title];

        if (currentId === targetTaskId) {
            return currentPath.join(" ➔ "); 
        }

        if (!visited.has(currentId)) {
            visited.add(currentId);

            if (currentTask && currentTask.dependencies) {
                currentTask.dependencies.forEach(depId => {
                    pathMap[depId] = currentPath;
                    stack.push(depId);
                });
            }
        }
    }
    return null;
}

async function renderEditDependenciesList(currentTask) {
    editDependList.innerHTML = "";
    
    let allTasks = await db.getAll("tasks");
    let filteredTasks = allTasks.filter(task => task.id !== currentTask.id);

    filteredTasks.forEach(task => {
        let label = document.createElement("label");
        label.className = "depend_task";
        
        let isChecked = (currentTask.dependencies || []).includes(task.id) ? "checked" : "";
        
        label.innerHTML = `
            ${task.title.length > 8 ? task.title.slice(0, 7) + "..." : task.title}
            <input type="checkbox" value="${task.id}" class="edit_dep_checkbox" ${isChecked}>
            <span class="checkmark"></span>
        `;
        editDependList.appendChild(label);
    });
}

// Global click event delegation
appRoot.addEventListener("click", async (event) => {
    let clickedOnDeleteBtn = event.target.closest('.delete_task_btn');
    if (clickedOnDeleteBtn) {
        event.stopPropagation()
        
        let task = clickedOnDeleteBtn.closest(".task_card"); 
        
        if (task) {
            await db.delete("tasks", task.dataset.id);
            renderKanbanBoard();
        }
        return; 
    }


    let btn = event.target.closest('.add_task_btn');
    
    if (btn) {
        currentColumnStatus = btn.dataset.status;
        add_task_overlay.style.display = "flex";
        taskTitle.focus();
        
        await renderDependenciesList();
        return;
    }


    let clickedOnCard = event.target.closest('.task_card');
    if (clickedOnCard) {
        let task = await db.get("tasks", clickedOnCard.dataset.id);
        errorBox.style.display = "none";
        editTitleInput.value = task.title;
        editDescInput.value = task.description;
        editDependList.innerHTML = "";
        await renderEditDependenciesList(task);

        currentEditingTaskId = task.id;
        editTaskOverlay.style.display = "flex";
    }
}); 

// Clear input error styling on typing
editTitleInput.addEventListener("input", () => {
    editTitleInput.classList.remove("input_error");
    document.getElementById("cycle_error_msg").style.display = "none";
});

editTaskOverlay.addEventListener("click", async (event) => {
    if (event.target.closest(".cancel_edit_task_btn") || event.target === editTaskOverlay) {
        editTaskOverlay.style.display = "none";
        currentEditingTaskId = null;
        return;
    }


    let clickedOnSave = event.target.closest(".save_edit_task_btn");
    if (clickedOnSave) {
        let inputTitle = editTitleInput.value.trim();
        if (inputTitle === "") {
            editTitleInput.classList.add("input_error");
            editTitleInput.focus();
            return;
        }

        let task = await db.get("tasks", currentEditingTaskId);
        task.title = inputTitle;
        task.description = editDescInput.value.trim();

        let checkedInputs = editDependList.querySelectorAll('.edit_dep_checkbox:checked');
        let newDependencies = Array.from(checkedInputs).map(input => input.value);
        let errorBox = document.getElementById("cycle_error_msg");
        let cycleString = await getCyclePath(currentEditingTaskId, newDependencies);

        if (cycleString) {
            errorBox.textContent = `LOOP: ${cycleString}`;
            errorBox.style.display = "block";
            return;
        }
        errorBox.style.display = "none";
        task.dependencies = newDependencies;
        await db.update("tasks", task);


        editTaskOverlay.style.display = "none";
        currentEditingTaskId = null;
        renderKanbanBoard();
    }
});


async function renderDependenciesList() {
    dependenciesList.innerHTML = "";
    const allTasks = await db.getAll("tasks");

    if (allTasks.length === 0) {
        dependenciesList.innerHTML = "<p style='color: gray;'>No Available Tasks</p>";
        return;
    }

    allTasks.forEach(task => {
        let label = document.createElement("label");
        label.className = "depend_task";
        
        label.innerHTML = `
            ${task.title.length > 8 ? task.title.slice(0, 7) + "..." : task.title}
            <input type="checkbox" value="${task.id}" class="dep_checkbox">
            <span class="checkmark"></span>
        `;
        dependenciesList.appendChild(label);
    });
}


add_task_overlay.addEventListener("click", (event) => {
    let clickedInsideModal = event.target.closest(".add_task_modal");
    let clickedOnClose = event.target.closest(".close_btn");
    if (!clickedInsideModal || clickedOnClose) {
        closeAddTaskModal();
    }
});

cancelToAddBtn.addEventListener("click", closeAddTaskModal);

function closeAddTaskModal() {
    taskTitle.value = "";
    taskDesc.value = "";
    currentColumnStatus = null;
    dependenciesList.innerHTML = ""; 
    add_task_overlay.style.display = "none";
}

taskTitle.addEventListener("input", () => {
    taskTitle.classList.remove("input_error");
})

// Adding new task
confirmToAddBtn.addEventListener("click", async () => {
    if (!taskTitle.value.trim()) {
        taskTitle.classList.add("input_error");
        taskTitle.focus();
        return;
    }


    let selectedDependencies = [];
    let checkedBoxes = dependenciesList.querySelectorAll(".dep_checkbox:checked");
    checkedBoxes.forEach(box => {
        selectedDependencies.push(box.value);
    });

    let newTask = {
        id: Date.now().toString(), 
        title: taskTitle.value,
        description: taskDesc.value,
        status: currentColumnStatus,
        dependencies: selectedDependencies 
    }

    await db.add("tasks", newTask);
    
    closeAddTaskModal();
    
    renderKanbanBoard();
});


export async function renderKanbanBoard() {
    let currentColumnTasks = document.querySelectorAll(".column_tasks");
    currentColumnTasks.forEach((column) => {
        column.innerHTML = "";
    });

    let taskCounters = document.querySelectorAll(".task_count");
    taskCounters.forEach(counter => {
        counter.textContent = "0";
    });

    let allTasks = await db.getAll("tasks");

    for (let task of allTasks) {
        let taskStatus = task.status;
        let columnWithStatus = document.querySelector(`.kanban_column[data-status="${taskStatus}"]`);
        
        if (!columnWithStatus) continue; 

        let isLocked = false;

        if (task.dependencies && task.dependencies.length > 0) {
            for (let depId of task.dependencies) {
                let parentTask = await db.get("tasks", depId);
                
                if (parentTask && parentTask.status !== "done") {
                    isLocked = true;
                    break;
                }
            }
        }

        let lockedClass = isLocked ? "locked_card" : "";
        let draggableAttr = isLocked ? "false" : "true";
        let lockIcon = isLocked ? "🔒 " : "";
        let tasksContainer = columnWithStatus.querySelector('.column_tasks');

        let cardHTML = `
            <div class="task_card ${lockedClass}" data-id="${task.id}" draggable="${draggableAttr}">
                <h3 class="task_title">${lockIcon} ${task.title}</h3>
                <p class="task_desc">${task.description}</p>
                <div class="task_footer">
                    <span class="task_id">#${task.id.slice(-4)}</span>
                    <button class="delete_task_btn"><img src="./public/delete-forever-svgrepo-com.svg" alt="delete task btn"></button>
                </div>
            </div>
        `;

        tasksContainer.insertAdjacentHTML('beforeend', cardHTML); 

        let countSpan = columnWithStatus.querySelector(".task_count");
        if (countSpan) {
            countSpan.textContent = parseInt(countSpan.textContent) + 1;
        }
    };
}

