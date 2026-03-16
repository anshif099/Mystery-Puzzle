import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const lineData = {
    labels: ['Mar 10', 'Mar 11', 'Mar 12', 'Mar 13', 'Mar 14', 'Mar 15', 'Mar 16'],
    datasets: [
      {
        label: 'Participants',
        data: [120, 450, 800, 1500, 2400, 3200, 4326],
        borderColor: '#63D3A4',
        backgroundColor: 'rgba(99, 211, 164, 0.2)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const pieData = {
    labels: ['Solved', 'Unsolved', 'In Progress'],
    datasets: [
      {
        data: [1284, 2150, 892],
        backgroundColor: ['#63D3A4', '#E8E78E', '#9AA6D6'],
        borderWidth: 0,
      },
    ],
  };

  const barData = {
    labels: ['Campaign A', 'Campaign B', 'Campaign C', 'Campaign D', 'Campaign E'],
    datasets: [
      {
        label: 'Avg completion time (s)',
        data: [102, 85, 96, 110, 89],
        backgroundColor: '#6FA8DC',
        borderRadius: 12,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { weight: 'bold' } }
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { display: false } },
      x: { grid: { display: false } }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-4 lg:p-8 rounded-[32px] lg:rounded-[40px] soft-shadow border border-gray-50 h-[350px] lg:h-[400px]">
        <h3 className="text-sm lg:text-xl font-black mb-6 uppercase tracking-tight">Total Participants Over Time</h3>
        <div className="h-[250px] lg:h-[300px]">
          <Line data={lineData} options={options} />
        </div>
      </div>

      <div className="bg-white p-4 lg:p-8 rounded-[32px] lg:rounded-[40px] soft-shadow border border-gray-50 h-[350px] lg:h-[400px]">
        <h3 className="text-sm lg:text-xl font-black mb-6 uppercase tracking-tight">Puzzle Success Rate</h3>
        <div className="h-[250px] lg:h-[300px]">
          <Pie data={pieData} options={options} />
        </div>
      </div>

      <div className="bg-white p-4 lg:p-8 rounded-[32px] lg:rounded-[40px] soft-shadow border border-gray-50 h-[350px] lg:h-[400px] lg:col-span-2">
        <h3 className="text-sm lg:text-xl font-black mb-6 uppercase tracking-tight">Average Completion Time by Campaign</h3>
        <div className="h-[250px] lg:h-[300px]">
          <Bar data={barData} options={options} />
        </div>
      </div>
    </div>
  );
};

export default Analytics;
