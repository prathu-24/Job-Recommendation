import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface SkillRadarChartProps {
  matchingSkills: string[];
  missingSkills: string[];
}

export const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ matchingSkills, missingSkills }) => {
  // Construct data for the Radar Chart
  // Combine matching and missing skills, capping at 7 total to keep chart neat and legible.
  const allSkills = [
    ...matchingSkills.map(s => ({ name: s, You: 100, Required: 100 })),
    ...missingSkills.map(s => ({ name: s, You: 20, Required: 100 }))
  ].slice(0, 7);

  if (allSkills.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-dark-400">
        No skills available to map. Upload a resume with skills to view chart comparison.
      </div>
    );
  }

  // If there are too few points, duplicate or pad to make the radar chart draw properly (minimum 3 points)
  while (allSkills.length < 3) {
    allSkills.push({ name: `Skill-Padding-${allSkills.length}`, You: 0, Required: 0 });
  }

  return (
    <div className="w-full h-[220px] flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={allSkills}>
          <PolarGrid stroke="#374151" />
          <PolarAngleAxis 
            dataKey="name" 
            tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={[0, 100]} 
            tick={{ fill: '#4b5563', fontSize: 8 }}
            axisLine={false}
          />
          <Radar
            name="Job Requirements"
            dataKey="Required"
            stroke="#a855f7"
            fill="#a855f7"
            fillOpacity={0.15}
          />
          <Radar
            name="Your Skills"
            dataKey="You"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
export default SkillRadarChart;
