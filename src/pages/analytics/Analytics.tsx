import React from 'react';
import { Download, LineChart, MapPinned, TrendingUp, UsersRound } from 'lucide-react';
import './Analytics.css';

type RankMetric = {
  name: string;
  parent?: string;
  value: number;
  detail: string;
};

type DistrictMetric = RankMetric & {
  investment: number;
  turnover: number;
  shg: number;
  crp: number;
  activities: number;
  technicalSessionsNeeded: number;
};

type TurnoverBifurcation = {
  level: string;
  title: string;
  rows: RankMetric[];
};

const districtMetrics: DistrictMetric[] = [
  {
    name: 'West Tripura',
    value: 8200000,
    investment: 8200000,
    turnover: 14200000,
    shg: 426,
    crp: 84,
    activities: 312,
    technicalSessionsNeeded: 37,
    detail: 'Highest investment pipeline with strong SHG enterprise adoption.',
  },
  {
    name: 'Gomati',
    value: 7600000,
    investment: 7600000,
    turnover: 12600000,
    shg: 398,
    crp: 71,
    activities: 286,
    technicalSessionsNeeded: 29,
    detail: 'High turnover from paddy, duck farming, and vegetable clusters.',
  },
  {
    name: 'Dhalai',
    value: 6900000,
    investment: 6900000,
    turnover: 11300000,
    shg: 361,
    crp: 67,
    activities: 245,
    technicalSessionsNeeded: 34,
    detail: 'Large SHG base with increased technical training demand.',
  },
  {
    name: 'Khowai',
    value: 6100000,
    investment: 6100000,
    turnover: 9800000,
    shg: 318,
    crp: 58,
    activities: 216,
    technicalSessionsNeeded: 24,
    detail: 'Pig rearing and market-linked activities are driving turnover.',
  },
  {
    name: 'Unakoti',
    value: 5400000,
    investment: 5400000,
    turnover: 8700000,
    shg: 287,
    crp: 49,
    activities: 184,
    technicalSessionsNeeded: 21,
    detail: 'Banana plantation and allied farm activity clusters are growing.',
  },
];

const turnoverBifurcation: TurnoverBifurcation[] = [
  {
    level: 'District',
    title: 'District Turnover',
    rows: districtMetrics.map((district) => ({
      name: district.name,
      value: district.turnover,
      detail: district.detail,
    })),
  },
  {
    level: 'Block',
    title: 'Block Turnover',
    rows: [
      { name: 'Old Agartala', parent: 'West Tripura', value: 4200000, detail: 'Retail, mushroom, and goat rearing clusters.' },
      { name: 'Matabari', parent: 'Gomati', value: 3900000, detail: 'Paddy cultivation and livestock enterprises.' },
      { name: 'Ambassa', parent: 'Dhalai', value: 3500000, detail: 'Vegetable farming and producer group activity.' },
      { name: 'Khowai', parent: 'Khowai', value: 3100000, detail: 'Pig rearing and custom hiring support.' },
    ],
  },
  {
    level: 'Gram Panchayat',
    title: 'Gram Panchayat Turnover',
    rows: [
      { name: 'Khayerpur GP', parent: 'Old Agartala', value: 2100000, detail: 'Highest GP turnover in static sample.' },
      { name: 'Matarbari GP', parent: 'Matabari', value: 1900000, detail: 'Paddy and duck farming income growth.' },
      { name: 'Kulai GP', parent: 'Ambassa', value: 1750000, detail: 'Vegetable farming cluster performance.' },
      { name: 'Tulashikhar GP', parent: 'Khowai', value: 1420000, detail: 'Livestock activity concentration.' },
    ],
  },
  {
    level: 'Village',
    title: 'Village Turnover',
    rows: [
      { name: 'Khayerpur', parent: 'Khayerpur GP', value: 980000, detail: 'Mushroom and goat rearing units.' },
      { name: 'Udaipur', parent: 'Matarbari GP', value: 910000, detail: 'Paddy and allied farm activities.' },
      { name: 'Kulai Para', parent: 'Kulai GP', value: 850000, detail: 'Vegetable farming activity density.' },
      { name: 'Paschim Sonatala', parent: 'Tulashikhar GP', value: 760000, detail: 'Pig rearing turnover growth.' },
    ],
  },
];

const shgBifurcation: TurnoverBifurcation[] = [
  {
    level: 'District',
    title: 'SHG by District',
    rows: districtMetrics.map((district) => ({
      name: district.name,
      value: district.shg,
      detail: `${district.shg} SHGs mapped in this static snapshot.`,
    })),
  },
  {
    level: 'Block',
    title: 'SHG by Block',
    rows: [
      { name: 'Old Agartala', parent: 'West Tripura', value: 118, detail: 'Highest block SHG concentration.' },
      { name: 'Matabari', parent: 'Gomati', value: 106, detail: 'Strong farm livelihood SHG coverage.' },
      { name: 'Ambassa', parent: 'Dhalai', value: 98, detail: 'Vegetable and service SHG clusters.' },
      { name: 'Jampuijala', parent: 'Sepahijala', value: 91, detail: 'Turmeric and farm activity SHGs.' },
    ],
  },
  {
    level: 'Gram Panchayat',
    title: 'SHG by Gram Panchayat',
    rows: [
      { name: 'Khayerpur GP', parent: 'Old Agartala', value: 42, detail: 'Most SHGs among sample GPs.' },
      { name: 'Matarbari GP', parent: 'Matabari', value: 39, detail: 'Paddy-linked SHG activity base.' },
      { name: 'Kulai GP', parent: 'Ambassa', value: 36, detail: 'Vegetable farming SHG network.' },
      { name: 'Jampuijala GP', parent: 'Jampuijala', value: 33, detail: 'Turmeric cluster support.' },
    ],
  },
  {
    level: 'Village',
    title: 'SHG by Village',
    rows: [
      { name: 'Khayerpur', parent: 'Khayerpur GP', value: 18, detail: 'Highest village SHG count.' },
      { name: 'Udaipur', parent: 'Matarbari GP', value: 16, detail: 'Farm-based SHG coverage.' },
      { name: 'Kulai Para', parent: 'Kulai GP', value: 15, detail: 'Vegetable producer activity.' },
      { name: 'Jampuijala', parent: 'Jampuijala GP', value: 14, detail: 'Turmeric activity SHGs.' },
    ],
  },
];

const crpDistrictRows: RankMetric[] = districtMetrics.map((district) => ({
  name: district.name,
  value: district.crp,
  detail: `${district.crp} CRPs assigned across district livelihood activities.`,
}));

const crpBlockRows: RankMetric[] = [
  { name: 'Old Agartala', parent: 'West Tripura', value: 22, detail: 'Largest CRP block coverage.' },
  { name: 'Matabari', parent: 'Gomati', value: 19, detail: 'High activity tracking load.' },
  { name: 'Ambassa', parent: 'Dhalai', value: 18, detail: 'Vegetable and producer group tracking.' },
  { name: 'Khowai', parent: 'Khowai', value: 16, detail: 'Livestock-focused CRP support.' },
];

const activityRows: RankMetric[] = [
  { name: 'Khayerpur', parent: 'Old Agartala / West Tripura', value: 64, detail: 'Most activities at village level.' },
  { name: 'Udaipur', parent: 'Matabari / Gomati', value: 58, detail: 'Paddy, duck farming, and farm activities.' },
  { name: 'Kulai Para', parent: 'Ambassa / Dhalai', value: 53, detail: 'Vegetable and seasonal cultivation.' },
  { name: 'Paschim Sonatala', parent: 'Khowai / Khowai', value: 47, detail: 'Pig rearing and livestock activities.' },
  { name: 'Pecharthal', parent: 'Kumarghat / Unakoti', value: 41, detail: 'Banana plantation activity cluster.' },
];

const technicalSessionRows: RankMetric[] = districtMetrics.map((district) => ({
  name: district.name,
  value: district.technicalSessionsNeeded,
  detail: `${district.technicalSessionsNeeded} technical sessions needed based on static training gap score.`,
}));

const formatNumber = (value: number): string => new Intl.NumberFormat('en-IN').format(value);

const formatMoney = (value: number): string =>
  `INR ${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value)}`;

const exportAnalyticsCSV = () => {
  const rows = [
    ['Section', 'Level', 'Name', 'Parent', 'Value', 'Detail'],
    ...districtMetrics.map((row) => [
      'Investment',
      'District',
      row.name,
      '',
      row.investment,
      row.detail,
    ]),
    ...turnoverBifurcation.flatMap((section) =>
      section.rows.map((row) => ['Turnover Bifurcation', section.level, row.name, row.parent ?? '', row.value, row.detail]),
    ),
    ...shgBifurcation.flatMap((section) =>
      section.rows.map((row) => ['SHG Count', section.level, row.name, row.parent ?? '', row.value, row.detail]),
    ),
    ...crpDistrictRows.map((row) => ['CRP Count', 'District', row.name, row.parent ?? '', row.value, row.detail]),
    ...crpBlockRows.map((row) => ['CRP Count', 'Block', row.name, row.parent ?? '', row.value, row.detail]),
    ...activityRows.map((row) => ['Activities', 'Village / Block / District', row.name, row.parent ?? '', row.value, row.detail]),
    ...technicalSessionRows.map((row) => ['Technical Session Needed', 'District', row.name, '', row.value, row.detail]),
  ];

  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'trlm-static-analytics.csv';
  anchor.click();
  URL.revokeObjectURL(url);
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  note: string;
  tone: 'blue' | 'green' | 'amber' | 'red';
  icon: React.ReactNode;
}> = ({ label, value, note, tone, icon }) => (
  <article className={`analytics-kpi analytics-kpi--${tone}`}>
    <div className="analytics-kpi__icon">{icon}</div>
    <span>{label}</span>
    <strong>{value}</strong>
    <p>{note}</p>
  </article>
);

const Analytics: React.FC = () => {
  const topInvestmentDistrict = [...districtMetrics].sort((a, b) => b.investment - a.investment)[0];
  const topTurnoverDistrict = [...districtMetrics].sort((a, b) => b.turnover - a.turnover)[0];
  const topShgDistrict = [...districtMetrics].sort((a, b) => b.shg - a.shg)[0];
  const topTechnicalDistrict = [...districtMetrics].sort((a, b) => b.technicalSessionsNeeded - a.technicalSessionsNeeded)[0];
  const totalTurnover = districtMetrics.reduce((sum, row) => sum + row.turnover, 0);
  const totalShg = districtMetrics.reduce((sum, row) => sum + row.shg, 0);

  return (
    <section className="page-shell analytics-page">
      <div className="page-stack">
        <div className="analytics-actions">
          <button className="analytics-download" type="button" onClick={exportAnalyticsCSV}>
            <Download size={18} />
            Download Details
          </button>
        </div>

        <section className="analytics-kpi-grid">
          <MetricCard
            label="Top Investment District"
            value={topInvestmentDistrict.name}
            note={formatMoney(topInvestmentDistrict.investment)}
            tone="blue"
            icon={<TrendingUp size={22} />}
          />
          <MetricCard
            label="Total Turnover"
            value={formatMoney(totalTurnover)}
            note={`${topTurnoverDistrict.name} is leading district turnover.`}
            tone="green"
            icon={<LineChart size={22} />}
          />
          <MetricCard
            label="SHG Coverage"
            value={formatNumber(totalShg)}
            note={`${topShgDistrict.name} has the highest SHG count.`}
            tone="amber"
            icon={<UsersRound size={22} />}
          />
          <MetricCard
            label="Training Need"
            value={topTechnicalDistrict.name}
            note={`${topTechnicalDistrict.technicalSessionsNeeded} technical sessions needed.`}
            tone="red"
            icon={<MapPinned size={22} />}
          />
        </section>

      </div>
    </section>
  );
};

export default Analytics;
