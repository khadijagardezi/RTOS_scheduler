class Task {
    constructor(name, computation, arrival = 0, period = null, deadline = null) {
        this.name = name;
        this.computation = computation;
        this.arrival = arrival;
        this.period = period;
        this.deadline = deadline;
    }

    get is_periodic() {
        return this.period !== null && !isNaN(this.period);
    }
}

let globalTasks = [];

const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
const lcm = (a, b) => (a * b) / gcd(a, b);

function addTask() {
    const name = document.getElementById("t_name").value.trim() || `T${globalTasks.length + 1}`;
    const comp = parseInt(document.getElementById("t_comp").value);
    const arr = parseInt(document.getElementById("t_arr").value) || 0;
    const periodVal = document.getElementById("t_period").value;
    const deadVal = document.getElementById("t_dead").value;

    const period = periodVal ? parseInt(periodVal) : null;
    const deadline = deadVal ? parseInt(deadVal) : period;

    if (isNaN(comp) || comp <= 0) {
        alert("Computation time must be greater than 0.");
        return;
    }

    if (period !== null && comp > period) {
        alert("Computation time cannot exceed the period.");
        return;
    }

    globalTasks.push(new Task(name, comp, arr, period, deadline));
    renderTable();
    document.getElementById("t_name").value = `T${globalTasks.length + 1}`;
    document.getElementById("t_comp").value = 2;
    document.getElementById("t_arr").value = 0;
    document.getElementById("t_period").value = "";
    document.getElementById("t_dead").value = "";
}

function deleteTask(index) {
    globalTasks.splice(index, 1);
    renderTable();
}

function renderTable() {
    const tbody = document.querySelector("#taskTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    globalTasks.forEach((t, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><strong>${t.name}</strong></td>
            <td>${t.computation}</td>
            <td>${t.arrival}</td>
            <td>${t.period ?? '-'}</td>
            <td>${t.deadline ?? '-'}</td>
            <td><button class="btn-delete" onclick="deleteTask(${index})">X</button></td>
        `;
        tbody.appendChild(row);
    });
}

function runSimulation() {
    if (globalTasks.length === 0) {
        document.getElementById("chart").innerHTML = "<p style='padding:20px'>Please add at least one task.</p>";
        return;
    }

    const algoKey = document.getElementById("algorithm").value;

    const periods = globalTasks.filter(t => t.is_periodic).map(t => t.period);
    let limit = periods.length > 0 ? periods.reduce(lcm) : 30;
    if (limit > 200) limit = 200;

    const all_jobs = [];
    const taskEvents = [];

    for (const t of globalTasks) {
        if (t.is_periodic) {
            for (let tick = t.arrival; tick < limit; tick += t.period) {
                const deadline = t.deadline !== null ? tick + t.deadline : Infinity;
                all_jobs.push({ taskName: t.name, arrival: tick, deadline, computation: t.computation, remaining: t.computation, period: t.period });
                taskEvents.push({ task: t.name, type: 'arrival', time: tick });
                if (deadline !== Infinity) taskEvents.push({ task: t.name, type: 'deadline', time: deadline });
            }
        } else if (t.arrival < limit) {
            const deadline = t.deadline !== null ? t.deadline : Infinity;
            all_jobs.push({ taskName: t.name, arrival: t.arrival, deadline, computation: t.computation, remaining: t.computation, period: Infinity });
            taskEvents.push({ task: t.name, type: 'arrival', time: t.arrival });
            if (deadline !== Infinity) taskEvents.push({ task: t.name, type: 'deadline', time: deadline });
        }
    }

    let active_jobs = [];
    const log = [];
    const completedInstances = [];
    let current_job = null;
    let start_time = 0;
    let missedDeadlines = false;

    for (let tick = 0; tick < limit; tick++) {
        active_jobs.push(...all_jobs.filter(j => j.arrival === tick));

        for (const j of active_jobs) {
            if (tick >= j.deadline) missedDeadlines = true;
        }


        let next_job = null;
        if (active_jobs.length > 0) {
            if (algoKey === 'edf') {
                next_job = active_jobs.reduce((min, j) => j.deadline < min.deadline ? j : min);
            } else if (algoKey === 'rm') {
                next_job = active_jobs.reduce((min, j) => j.period < min.period ? j : min);
            } else if (algoKey === 'fcfs') {
                next_job = (current_job && active_jobs.includes(current_job))
                    ? current_job
                    : active_jobs.reduce((min, j) => j.arrival < min.arrival ? j : min);
            }
        }

        if (next_job !== current_job) {
            if (current_job && active_jobs.includes(current_job) && tick > start_time) {
                log.push({ Task: current_job.taskName, Start: start_time, Finish: tick, Preempted: true, Late: tick > current_job.deadline });
            }
            current_job = next_job;
            start_time = tick;
        }

        if (current_job) {
            current_job.remaining--;
            if (current_job.remaining === 0) {
                const finishTime = tick + 1;
                const isLate = finishTime > current_job.deadline;
                log.push({ Task: current_job.taskName, Start: start_time, Finish: finishTime, Preempted: false, Late: isLate });
                completedInstances.push({ name: current_job.taskName, arrival: current_job.arrival, finish: finishTime, deadline: current_job.deadline });
                active_jobs = active_jobs.filter(j => j !== current_job);
                current_job = null;
            }
        }
    }

    if (current_job && active_jobs.includes(current_job)) {
        log.push({ Task: current_job.taskName, Start: start_time, Finish: limit, Preempted: true, Late: limit > current_job.deadline });
    }

    document.getElementById("statusMessage").innerText =
        missedDeadlines ? "⚠️ Warning: One or more deadlines were missed!" : "";

    const metrics = { avgResponseTime: 0, totalCompletionTime: 0, maxLateness: 0, lateTasksCount: 0, utilization: 0 };

    globalTasks.forEach(t => {
        if (t.is_periodic && t.period > 0) metrics.utilization += t.computation / t.period;
    });

    let totalResp = 0;
    let maxLate = -Infinity;
    let lateCount = 0;
    let minArr = Infinity;
    let maxFin = -Infinity;

    completedInstances.forEach(inst => {
        totalResp += inst.finish - inst.arrival;
        if (inst.arrival < minArr) minArr = inst.arrival;
        if (inst.finish > maxFin) maxFin = inst.finish;
        if (inst.deadline !== Infinity) {
            const lateness = inst.finish - inst.deadline;
            if (lateness > maxLate) maxLate = lateness;
            if (lateness > 0) lateCount++;
        }
    });

    active_jobs.forEach(j => {
        if (limit > j.deadline) {
            const lateness = limit - j.deadline;
            if (lateness > maxLate) maxLate = lateness;
            lateCount++;
        }
    });

    if (completedInstances.length > 0) {
        metrics.avgResponseTime = (totalResp / completedInstances.length).toFixed(2);
        metrics.totalCompletionTime = maxFin - (minArr === Infinity ? 0 : minArr);
    }
    metrics.maxLateness = maxLate !== -Infinity ? maxLate : 0;
    metrics.lateTasksCount = lateCount;

    drawGanttChart(log, globalTasks.map(t => t.name), limit, taskEvents, algoKey, metrics);
}

function drawGanttChart(log, taskNames, limit, taskEvents, algoKey, metrics) {
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#34495e'];
    const reversedTaskNames = [...taskNames].reverse();
    const traces = [];

    taskNames.forEach((taskName, index) => {
        const taskLog = log.filter(e => e.Task === taskName);
        const color = colors[index % colors.length];

        const normalLog = taskLog.filter(e => !e.Late);
        if (normalLog.length > 0) {
            traces.push({
                name: taskName,
                type: 'bar',
                orientation: 'h',
                y: normalLog.map(e => e.Task),
                x: normalLog.map(e => e.Finish - e.Start),
                base: normalLog.map(e => e.Start),
                marker: { color, line: { color: 'white', width: 2 } },
                text: normalLog.map(() => taskName),
                textposition: 'inside',
                insidetextanchor: 'middle',
                hovertext: normalLog.map(e => `<b>${taskName}</b><br>Start: ${e.Start}<br>Finish: ${e.Finish}`),
                hoverinfo: 'text'
            });
        }

        const lateLog = taskLog.filter(e => e.Late);
        if (lateLog.length > 0) {
            traces.push({
                name: `${taskName} (Late)`,
                type: 'bar',
                orientation: 'h',
                y: lateLog.map(e => e.Task),
                x: lateLog.map(e => e.Finish - e.Start),
                base: lateLog.map(e => e.Start),
                marker: { color: '#fff', pattern: { shape: '/', fgcolor: '#ccc', fgopacity: 1 } },
                text: lateLog.map(() => taskName),
                textposition: 'inside',
                insidetextanchor: 'middle',
                hovertext: lateLog.map(e => `<b>${taskName}</b><br>Start: ${e.Start}<br>Finish: ${e.Finish}<br><i>(LATE)</i>`),
                hoverinfo: 'text'
            });
        }
    });

    const completionDots = {
        type: 'scatter',
        mode: 'markers',
        x: log.filter(e => !e.Preempted).map(e => e.Finish),
        y: log.filter(e => !e.Preempted).map(e => e.Task),
        marker: { color: 'black', size: 14, symbol: 'circle' },
        hoverinfo: 'skip',
        showlegend: false
    };

    const shapes = [];
    const annotations = [];

    taskEvents.forEach(event => {
        if (event.time > limit) return;
        const yPos = reversedTaskNames.indexOf(event.task);
        const barTop = yPos + 0.4;
        const barBottom = yPos - 0.4;

        shapes.push({
            type: 'line', x0: event.time, x1: event.time,
            y0: barBottom, y1: barTop, yref: 'y',
            line: { dash: 'dot', color: 'black', width: 2 }
        });

        annotations.push({
            x: event.time,
            y: event.type === 'arrival' ? barBottom : barTop,
            yref: 'y',
            showarrow: true, arrowhead: 2, arrowsize: 1.5, arrowcolor: 'black',
            ax: 0, ay: event.type === 'arrival' ? -15 : 15
        });
    });

    const layout = {
        title: `Schedule — 1 Major Cycle (${limit} ticks) | ${algoKey.toUpperCase()}`,
        barmode: 'stack',
        xaxis: { title: 'Ticks', tickmode: 'linear', dtick: 1, range: [0, limit] },
        yaxis: { title: '', categoryorder: 'array', categoryarray: reversedTaskNames },
        showlegend: false,
        margin: { l: 50, r: 20, t: 50, b: 50 },
        shapes,
        annotations
    };

    Plotly.newPlot('chart', [...traces, completionDots], layout, { displayModeBar: false, responsive: true });

    renderMetrics(metrics);
}

function renderMetrics(metrics) {
    const utilPercent = (metrics.utilization * 100).toFixed(1);
    const uColor = metrics.utilization > 1 ? '#e74c3c' : '#2ecc71';
    const lateColor = metrics.lateTasksCount > 0 ? '#e74c3c' : '#2c3e50';

    let container = document.getElementById("legendContainer");
    if (!container) {
        container = document.createElement("div");
        container.id = "legendContainer";
        document.getElementById("chart").parentNode.appendChild(container);
    }

    container.innerHTML = `
        <div class="legend-box" style="margin-top: 20px; display: flex; flex-wrap: wrap; gap: 20px;">
            <div style="flex: 1; min-width: 240px; padding-left: 20px; border-left: 1px solid #eee;">
                <h3 style="margin-top: 0; color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 8px;">Simulation Metrics</h3>
                <ul style="list-style: none; padding: 0; margin: 0; line-height: 2;">
                    <li><strong>Processor Utilization (U):</strong>
                        <span style="color:${uColor}; font-weight:bold; padding:2px 6px; background:rgba(0,0,0,0.05); border-radius:4px;">${utilPercent}%</span>
                        ${metrics.utilization > 1 ? '<span style="color:#e74c3c; font-size:0.9em;"> (Overload)</span>' : ''}
                    </li>
                    <li><strong>Average Response Time:</strong> ${metrics.avgResponseTime} ticks</li>
                    <li><strong>Total Completion Time:</strong> ${metrics.totalCompletionTime} ticks</li>
                    <li><strong>Maximum Lateness:</strong> ${metrics.maxLateness} ticks</li>
                    <li><strong>Late Tasks:</strong>
                        <span style="color:${lateColor}; font-weight:${metrics.lateTasksCount > 0 ? 'bold' : 'normal'};">${metrics.lateTasksCount} instance(s) missed</span>
                    </li>
                </ul>
            </div>
        </div>
    `;
}

window.addEventListener('DOMContentLoaded', () => {
    globalTasks.push(new Task("T1", 2, 0, 4, 4));
    globalTasks.push(new Task("T2", 3, 0, 6, 6));
    renderTable();
    runSimulation();
});
