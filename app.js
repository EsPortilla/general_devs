// Data Storage Manager
class DataStore {
    constructor() {
        this.ideas = this.loadIdeas();
        this.tasks = this.loadTasks();
    }

    loadIdeas() {
        const stored = localStorage.getItem('ideas');
        return stored ? JSON.parse(stored) : [];
    }

    saveIdeas() {
        localStorage.setItem('ideas', JSON.stringify(this.ideas));
    }

    loadTasks() {
        const stored = localStorage.getItem('tasks');
        return stored ? JSON.parse(stored) : [];
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    addIdea(idea) {
        idea.id = Date.now().toString();
        idea.createdAt = new Date().toISOString();
        this.ideas.push(idea);
        this.saveIdeas();
        return idea;
    }

    updateIdea(id, updates) {
        const index = this.ideas.findIndex(i => i.id === id);
        if (index !== -1) {
            this.ideas[index] = { ...this.ideas[index], ...updates };
            this.saveIdeas();
            return this.ideas[index];
        }
        return null;
    }

    deleteIdea(id) {
        this.ideas = this.ideas.filter(i => i.id !== id);
        this.tasks = this.tasks.filter(t => t.ideaId !== id);
        this.saveIdeas();
        this.saveTasks();
    }

    getIdea(id) {
        return this.ideas.find(i => i.id === id);
    }

    addTask(task) {
        task.id = Date.now().toString();
        task.createdAt = new Date().toISOString();
        this.tasks.push(task);
        this.saveTasks();
        return task;
    }

    updateTask(id, updates) {
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
            this.tasks[index] = { ...this.tasks[index], ...updates };
            this.saveTasks();
            return this.tasks[index];
        }
        return null;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
    }

    getTasksForIdea(ideaId) {
        return this.tasks.filter(t => t.ideaId === ideaId);
    }

    getTasksByStatus(status, ideaId = null) {
        let filtered = this.tasks.filter(t => t.status === status);
        if (ideaId && ideaId !== 'all') {
            filtered = filtered.filter(t => t.ideaId === ideaId);
        }
        return filtered;
    }
}

// Application Manager
class IdeaMarketApp {
    constructor() {
        this.dataStore = new DataStore();
        this.currentView = 'dashboard';
        this.currentFilter = 'all';
        this.editingTaskId = null;

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDashboard();
        this.updateStats();
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // Idea Form
        document.getElementById('idea-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleIdeaSubmit();
        });

        document.getElementById('cancel-idea').addEventListener('click', () => {
            this.switchView('dashboard');
        });

        // Task Modal
        document.getElementById('add-task-btn').addEventListener('click', () => {
            this.openTaskModal();
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeTaskModal();
            });
        });

        document.getElementById('task-modal').addEventListener('click', (e) => {
            if (e.target.id === 'task-modal') {
                this.closeTaskModal();
            }
        });

        document.getElementById('task-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTaskSubmit();
        });

        // Idea Modal
        document.querySelector('.close-idea-modal').addEventListener('click', () => {
            this.closeIdeaModal();
        });

        document.getElementById('idea-modal').addEventListener('click', (e) => {
            if (e.target.id === 'idea-modal') {
                this.closeIdeaModal();
            }
        });

        // Task Filter
        document.getElementById('filter-idea').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.renderTaskBoard();
        });
    }

    switchView(view) {
        this.currentView = view;

        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update views
        document.querySelectorAll('.view').forEach(v => {
            v.classList.remove('active');
        });
        document.getElementById(`${view}-view`).classList.add('active');

        // Render content based on view
        if (view === 'dashboard') {
            this.renderDashboard();
            this.updateStats();
        } else if (view === 'new-idea') {
            document.getElementById('idea-form').reset();
        } else if (view === 'tasks') {
            this.updateTaskFilters();
            this.renderTaskBoard();
        }
    }

    handleIdeaSubmit() {
        const formData = {
            name: document.getElementById('idea-name').value,
            description: document.getElementById('idea-description').value,
            category: document.getElementById('idea-category').value,
            stage: document.getElementById('idea-stage').value,
            targetMarket: document.getElementById('target-market').value,
            budget: document.getElementById('budget').value || 0,
            timeline: document.getElementById('timeline').value || 6,
            successCriteria: document.getElementById('success-criteria').value,
            teamMembers: document.getElementById('team-members').value.split(',').map(m => m.trim()).filter(m => m),
            tags: document.getElementById('tags').value.split(',').map(t => t.trim()).filter(t => t),
            notes: document.getElementById('notes').value
        };

        this.dataStore.addIdea(formData);
        this.switchView('dashboard');
        this.showNotification('Idea created successfully!');
    }

    renderDashboard() {
        const grid = document.getElementById('ideas-grid');
        const ideas = this.dataStore.ideas;

        if (ideas.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1/-1;">
                    <h3>No Ideas Yet</h3>
                    <p>Start by creating your first idea!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = ideas.map(idea => this.createIdeaCard(idea)).join('');

        // Add click listeners
        grid.querySelectorAll('.idea-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn-small')) {
                    this.showIdeaDetails(card.dataset.id);
                }
            });
        });

        grid.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteIdea(btn.dataset.id);
            });
        });
    }

    createIdeaCard(idea) {
        const tasks = this.dataStore.getTasksForIdea(idea.id);
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const progress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

        return `
            <div class="idea-card" data-id="${idea.id}">
                <div class="idea-card-header">
                    <div>
                        <h3>${idea.name}</h3>
                        <span class="idea-category">${idea.category}</span>
                    </div>
                    <span class="idea-stage stage-${idea.stage}">${idea.stage}</span>
                </div>
                <p class="idea-description">${idea.description}</p>
                <div class="idea-meta">
                    <div class="idea-meta-item">
                        <span>📊 Progress: ${progress}%</span>
                    </div>
                    <div class="idea-meta-item">
                        <span>✓ ${completedTasks}/${tasks.length} tasks</span>
                    </div>
                    ${idea.timeline ? `<div class="idea-meta-item"><span>⏱️ ${idea.timeline} months</span></div>` : ''}
                </div>
                <div class="idea-actions">
                    <button class="btn-small btn-delete" data-id="${idea.id}">Delete</button>
                </div>
            </div>
        `;
    }

    showIdeaDetails(ideaId) {
        const idea = this.dataStore.getIdea(ideaId);
        if (!idea) return;

        const tasks = this.dataStore.getTasksForIdea(ideaId);
        const modal = document.getElementById('idea-modal');
        const body = document.getElementById('idea-modal-body');

        body.innerHTML = `
            <div class="idea-detail-section">
                <h4>Basic Information</h4>
                <div class="idea-detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Name</div>
                        <div class="detail-value">${idea.name}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Stage</div>
                        <div class="detail-value">
                            <span class="idea-stage stage-${idea.stage}">${idea.stage}</span>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Category</div>
                        <div class="detail-value">${idea.category}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Created</div>
                        <div class="detail-value">${new Date(idea.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
                <div class="detail-item" style="margin-top: 16px;">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${idea.description}</div>
                </div>
            </div>

            <div class="idea-detail-section">
                <h4>Market Information</h4>
                <div class="idea-detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Target Market</div>
                        <div class="detail-value">${idea.targetMarket}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Budget</div>
                        <div class="detail-value">$${Number(idea.budget).toLocaleString()}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Timeline</div>
                        <div class="detail-value">${idea.timeline} months</div>
                    </div>
                </div>
                ${idea.successCriteria ? `
                    <div class="detail-item" style="margin-top: 16px;">
                        <div class="detail-label">Success Criteria</div>
                        <div class="detail-value">${idea.successCriteria}</div>
                    </div>
                ` : ''}
            </div>

            ${idea.teamMembers && idea.teamMembers.length > 0 ? `
                <div class="idea-detail-section">
                    <h4>Team Members</h4>
                    <div class="detail-value">${idea.teamMembers.join(', ')}</div>
                </div>
            ` : ''}

            ${idea.tags && idea.tags.length > 0 ? `
                <div class="idea-detail-section">
                    <h4>Tags</h4>
                    <div class="tags-container">
                        ${idea.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                </div>
            ` : ''}

            ${idea.notes ? `
                <div class="idea-detail-section">
                    <h4>Notes</h4>
                    <div class="detail-value">${idea.notes}</div>
                </div>
            ` : ''}

            <div class="idea-detail-section">
                <h4>Tasks (${tasks.length})</h4>
                ${tasks.length > 0 ? `
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${tasks.map(task => `
                            <div style="padding: 12px; background: var(--background); border-radius: 6px; border-left: 3px solid var(--primary-color);">
                                <div style="display: flex; justify-content: space-between; align-items: center;">
                                    <strong>${task.name}</strong>
                                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                                </div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px;">
                                    Status: ${task.status}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : '<p style="color: var(--text-secondary);">No tasks yet</p>'}
            </div>
        `;

        modal.classList.add('active');
    }

    closeIdeaModal() {
        document.getElementById('idea-modal').classList.remove('active');
    }

    deleteIdea(ideaId) {
        if (confirm('Are you sure you want to delete this idea? This will also delete all associated tasks.')) {
            this.dataStore.deleteIdea(ideaId);
            this.renderDashboard();
            this.updateStats();
            this.showNotification('Idea deleted successfully');
        }
    }

    updateStats() {
        const ideas = this.dataStore.ideas;
        const tasks = this.dataStore.tasks;

        document.getElementById('total-ideas').textContent = ideas.length;
        document.getElementById('active-projects').textContent =
            ideas.filter(i => i.stage !== 'market').length;
        document.getElementById('completed-tasks').textContent =
            tasks.filter(t => t.status === 'completed').length;
    }

    // Task Management
    updateTaskFilters() {
        const select = document.getElementById('filter-idea');
        const taskIdeaSelect = document.getElementById('task-idea');

        const options = [
            '<option value="all">All Ideas</option>',
            ...this.dataStore.ideas.map(idea =>
                `<option value="${idea.id}">${idea.name}</option>`
            )
        ].join('');

        select.innerHTML = options;
        taskIdeaSelect.innerHTML = '<option value="">Select an idea</option>' +
            this.dataStore.ideas.map(idea =>
                `<option value="${idea.id}">${idea.name}</option>`
            ).join('');
    }

    openTaskModal(taskId = null) {
        const modal = document.getElementById('task-modal');
        const form = document.getElementById('task-form');

        this.editingTaskId = taskId;

        if (taskId) {
            const task = this.dataStore.tasks.find(t => t.id === taskId);
            if (task) {
                document.getElementById('modal-title').textContent = 'Edit Task';
                document.getElementById('task-idea').value = task.ideaId;
                document.getElementById('task-name').value = task.name;
                document.getElementById('task-description').value = task.description || '';
                document.getElementById('task-priority').value = task.priority;
                document.getElementById('task-status').value = task.status;
                document.getElementById('task-assignee').value = task.assignee || '';
                document.getElementById('task-due-date').value = task.dueDate || '';
                document.getElementById('task-dependencies').value = task.dependencies?.join(', ') || '';
            }
        } else {
            document.getElementById('modal-title').textContent = 'Add Task';
            form.reset();
        }

        this.updateTaskFilters();
        modal.classList.add('active');
    }

    closeTaskModal() {
        document.getElementById('task-modal').classList.remove('active');
        document.getElementById('task-form').reset();
        this.editingTaskId = null;
    }

    handleTaskSubmit() {
        const taskData = {
            ideaId: document.getElementById('task-idea').value,
            name: document.getElementById('task-name').value,
            description: document.getElementById('task-description').value,
            priority: document.getElementById('task-priority').value,
            status: document.getElementById('task-status').value,
            assignee: document.getElementById('task-assignee').value,
            dueDate: document.getElementById('task-due-date').value,
            dependencies: document.getElementById('task-dependencies').value
                .split(',').map(d => d.trim()).filter(d => d)
        };

        if (this.editingTaskId) {
            this.dataStore.updateTask(this.editingTaskId, taskData);
            this.showNotification('Task updated successfully!');
        } else {
            this.dataStore.addTask(taskData);
            this.showNotification('Task created successfully!');
        }

        this.closeTaskModal();
        this.renderTaskBoard();
        this.updateStats();
    }

    renderTaskBoard() {
        const statuses = ['todo', 'in-progress', 'completed'];

        statuses.forEach(status => {
            const container = document.getElementById(`${status}-tasks`);
            const tasks = this.dataStore.getTasksByStatus(status, this.currentFilter);

            if (tasks.length === 0) {
                container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No tasks</p>';
                return;
            }

            container.innerHTML = tasks.map(task => this.createTaskCard(task)).join('');

            // Add event listeners
            container.querySelectorAll('.task-card').forEach(card => {
                this.setupTaskCardListeners(card);
            });
        });
    }

    createTaskCard(task) {
        const idea = this.dataStore.getIdea(task.ideaId);
        const ideaName = idea ? idea.name : 'Unknown Idea';

        return `
            <div class="task-card priority-${task.priority}" data-id="${task.id}" draggable="true">
                <div class="task-header">
                    <div class="task-name">${task.name}</div>
                    <span class="task-priority priority-${task.priority}">${task.priority}</span>
                </div>
                <div class="task-idea-name">📁 ${ideaName}</div>
                ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                <div class="task-meta">
                    ${task.assignee ? `<div>👤 ${task.assignee}</div>` : ''}
                    ${task.dueDate ? `<div>📅 ${new Date(task.dueDate).toLocaleDateString()}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="btn-small btn-edit" data-id="${task.id}">Edit</button>
                    <button class="btn-small btn-delete" data-id="${task.id}">Delete</button>
                </div>
            </div>
        `;
    }

    setupTaskCardListeners(card) {
        const taskId = card.dataset.id;

        // Edit button
        const editBtn = card.querySelector('.btn-edit');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openTaskModal(taskId);
            });
        }

        // Delete button
        const deleteBtn = card.querySelector('.btn-delete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteTask(taskId);
            });
        }

        // Drag and drop
        card.addEventListener('dragstart', (e) => {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', taskId);
            card.style.opacity = '0.5';
        });

        card.addEventListener('dragend', (e) => {
            card.style.opacity = '1';
        });

        // Setup drop zones
        const dropZones = document.querySelectorAll('.task-list');
        dropZones.forEach(zone => {
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            });

            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                const draggedTaskId = e.dataTransfer.getData('text/plain');
                const newStatus = zone.dataset.status;
                this.updateTaskStatus(draggedTaskId, newStatus);
            });
        });
    }

    updateTaskStatus(taskId, newStatus) {
        this.dataStore.updateTask(taskId, { status: newStatus });
        this.renderTaskBoard();
        this.updateStats();
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.dataStore.deleteTask(taskId);
            this.renderTaskBoard();
            this.updateStats();
            this.showNotification('Task deleted successfully');
        }
    }

    showNotification(message) {
        // Simple notification - could be enhanced with a proper notification system
        alert(message);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new IdeaMarketApp();
});
