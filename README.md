# RTOS Scheduler Simulator

An interactive, web-based simulator for visualizing Real-Time Operating System (RTOS) scheduling algorithms. This tool allows you to define tasks with specific computation times, arrivals, periods, and deadlines, and generates a dynamic Gantt chart showing how different algorithms schedule them.

## 🚀 Features

* **Multiple Algorithms**: Supports Earliest Deadline First (EDF), Rate Monotonic (RM), and First Come First Serve (FCFS).
* **Periodic & Aperiodic Tasks**: Mix and match continuous repeating tasks with one-off tasks.
* **Absolute vs Relative Deadlines**: Automatically handles relative deadlines for periodic tasks and absolute deadlines for aperiodic ones.
* **Interactive Visualizations**: Built with Plotly.js for hoverable, detailed Gantt charts.
* **Visual Indicators**: Clearly highlights task arrivals (↓), deadlines (↑), completions (⚫), and late executions (striped red).
* **Client-Side Only**: Runs entirely in your browser. No backend or server setup required.

## 🛠️ Getting Started
### 
1. Visit https://rtosscheduler.sandrini.cc/
2. Add your tasks using the sidebar form (T1 and T2 are provided as default examples).
3. Select your desired scheduling algorithm from the dropdown menu.
4. Click **▶ Run Simulation** to generate the Gantt chart.

## 🧠 Supported Algorithms

* **EDF (Earliest Deadline First)**: A dynamic priority algorithm. The scheduler always chooses the ready task with the closest absolute deadline. Preemptive.
* **RM (Rate Monotonic)**: A static priority algorithm. Tasks with shorter periods are assigned higher priority. It is mathematically optimal for static periodic task scheduling. Preemptive.
* **FCFS (First Come First Serve)**: A non-preemptive algorithm. The scheduler executes tasks strictly in the exact order they arrive, ignoring deadlines and periods.

## ⚠️ Limitations & Assumptions

* **Zero Overhead**: Context switching and scheduling computation times are assumed to be zero.
* **Simulation Horizon**: The simulation calculates exactly 1 Hyperperiod (the Least Common Multiple of all periodic tasks) and stops. To prevent browser freezing on complex inputs, the timeline is strictly capped at `200` ticks.
* **Defaults**: If a deadline is left blank for a periodic task, the simulation automatically assumes the relative deadline is equal to its period.

## 💻 Tech Stack

* **HTML5 / CSS3**: Layout and styling.
* **Vanilla JavaScript (ES6+)**: Simulation engine and logic.
* **[Plotly.js](https://plotly.com/javascript/)**: Data visualization and Gantt chart rendering.

## 📄 License

This project is open-source and available under the MIT License.
