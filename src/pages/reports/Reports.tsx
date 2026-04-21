import React from 'react';
import PageShell from '../../components/common/PageShell';
import './Reports.css';

type ReportRecord = {
  reportId: string;
  crpId: string;
  crpName: string;
  district: string;
  block: string;
  gramPanchayat: string;
  village: string;
  shgName: string;
  shgCode: string;
  memberName: string;
  memberCategory: string;
  activityName: string;
  seasonality: string;
  totalInvestment: number;
  annualIncomeBefore: number;
  annualIncomeAfter: number;
  progressStatus: string;
  assignedGeoLocation: string;
  trackingGeoLocation: string;
  trackingImage: string;
  trackingVideo: string;
  checkInDateTime: string;
  checkOutDateTime: string;
  visitDate: string;
  nextVisitDate: string;
  geoTagged: boolean;
};

const reportRows: ReportRecord[] = [
  {
    reportId: 'RPT-0001',
    crpId: 'CRP-1024',
    crpName: 'Agun Laxmi Murasing',
    district: 'Gomati',
    block: 'Matabari',
    gramPanchayat: 'Matarbari GP',
    village: 'Udaipur',
    shgName: 'Maa Laxmi Mahila Dal',
    shgCode: 'MLMD-GMT-01',
    memberName: 'Rina Tripura',
    memberCategory: 'ST',
    activityName: 'Paddy Cultivation',
    seasonality: 'Kharif',
    totalInvestment: 42000,
    annualIncomeBefore: 42000,
    annualIncomeAfter: 86400,
    progressStatus: 'In Progress',
    assignedGeoLocation: '23.5384, 91.4871',
    trackingGeoLocation: '23.5321, 91.4812',
    trackingImage: 'uploaded',
    trackingVideo: 'not uploaded',
    checkInDateTime: '2026-04-07 09:15 AM',
    checkOutDateTime: '2026-04-07 11:05 AM',
    visitDate: '2026-04-07',
    nextVisitDate: '2026-04-21',
    geoTagged: true,
  },
  {
    reportId: 'RPT-0002',
    crpId: 'CRP-1025',
    crpName: 'Mitali Debbarma',
    district: 'Dhalai',
    block: 'Ambassa',
    gramPanchayat: 'Kulai GP',
    village: 'Kulai Para',
    shgName: 'Jayanti SHG',
    shgCode: 'JSHG-DHL-02',
    memberName: 'Bulti Debbarma',
    memberCategory: 'ST',
    activityName: 'Vegetable Farming',
    seasonality: 'Rabi',
    totalInvestment: 36000,
    annualIncomeBefore: 38000,
    annualIncomeAfter: 79200,
    progressStatus: 'Completed',
    assignedGeoLocation: '23.9118, 91.8562',
    trackingGeoLocation: '23.9076, 91.8508',
    trackingImage: 'uploaded',
    trackingVideo: 'uploaded',
    checkInDateTime: '2026-04-05 10:00 AM',
    checkOutDateTime: '2026-04-05 12:10 PM',
    visitDate: '2026-04-05',
    nextVisitDate: '2026-04-18',
    geoTagged: true,
  },
  {
    reportId: 'RPT-0003',
    crpId: 'CRP-1026',
    crpName: 'Pritha Reang',
    district: 'North Tripura',
    block: 'Dasda',
    gramPanchayat: 'Uttar Dasda',
    village: 'Subhashnagar',
    shgName: 'Asha Mahila SHG',
    shgCode: 'AMS-NTP-03',
    memberName: 'Sanjita Reang',
    memberCategory: 'ST',
    activityName: 'Maize Cultivation',
    seasonality: 'Kharif',
    totalInvestment: 28500,
    annualIncomeBefore: 30000,
    annualIncomeAfter: 61800,
    progressStatus: 'In Progress',
    assignedGeoLocation: '24.1245, 92.0113',
    trackingGeoLocation: '24.1187, 92.0055',
    trackingImage: 'uploaded',
    trackingVideo: 'not uploaded',
    checkInDateTime: '2026-04-04 08:40 AM',
    checkOutDateTime: '2026-04-04 10:25 AM',
    visitDate: '2026-04-04',
    nextVisitDate: '2026-04-19',
    geoTagged: false,
  },
  {
    reportId: 'RPT-0004',
    crpId: 'CRP-1027',
    crpName: 'Bina Tripura',
    district: 'South Tripura',
    block: 'Bokafa',
    gramPanchayat: 'Santirbazar GP',
    village: 'Muhuripur',
    shgName: 'Annapurna SHG',
    shgCode: 'ASHG-STP-04',
    memberName: 'Purnima Tripura',
    memberCategory: 'SC',
    activityName: 'Poultry Farming',
    seasonality: 'Perennial',
    totalInvestment: 54000,
    annualIncomeBefore: 46000,
    annualIncomeAfter: 98800,
    progressStatus: 'Under Review',
    assignedGeoLocation: '23.0712, 91.6128',
    trackingGeoLocation: '23.0685, 91.6074',
    trackingImage: 'uploaded',
    trackingVideo: 'uploaded',
    checkInDateTime: '2026-04-03 11:20 AM',
    checkOutDateTime: '2026-04-03 01:15 PM',
    visitDate: '2026-04-03',
    nextVisitDate: '2026-04-17',
    geoTagged: true,
  },
  {
    reportId: 'RPT-0005',
    crpId: 'CRP-1028',
    crpName: 'Kaberi Das',
    district: 'West Tripura',
    block: 'Old Agartala',
    gramPanchayat: 'Khayerpur GP',
    village: 'Khayerpur',
    shgName: 'Sufala SHG',
    shgCode: 'SSHG-WTP-05',
    memberName: 'Mousumi Das',
    memberCategory: 'OBC',
    activityName: 'Mushroom Unit',
    seasonality: 'All Season',
    totalInvestment: 31000,
    annualIncomeBefore: 36000,
    annualIncomeAfter: 70200,
    progressStatus: 'Completed',
    assignedGeoLocation: '23.8874, 91.3402',
    trackingGeoLocation: '23.8828, 91.3366',
    trackingImage: 'uploaded',
    trackingVideo: 'not uploaded',
    checkInDateTime: '2026-04-06 09:05 AM',
    checkOutDateTime: '2026-04-06 10:35 AM',
    visitDate: '2026-04-06',
    nextVisitDate: '2026-04-20',
    geoTagged: true,
  },
  {
    reportId: 'RPT-0006',
    crpId: 'CRP-1029',
    crpName: 'Rupali Mog',
    district: 'Khowai',
    block: 'Khowai',
    gramPanchayat: 'Tulashikhar GP',
    village: 'Paschim Sonatala',
    shgName: 'Bandhan SHG',
    shgCode: 'BSHG-KHW-06',
    memberName: 'Mamata Mog',
    memberCategory: 'ST',
    activityName: 'Pig Rearing',
    seasonality: 'Perennial',
    totalInvestment: 67000,
    annualIncomeBefore: 52000,
    annualIncomeAfter: 113400,
    progressStatus: 'In Progress',
    assignedGeoLocation: '24.0615, 91.6117',
    trackingGeoLocation: '24.0559, 91.6068',
    trackingImage: 'not uploaded',
    trackingVideo: 'not uploaded',
    checkInDateTime: '2026-04-02 12:00 PM',
    checkOutDateTime: '2026-04-02 01:40 PM',
    visitDate: '2026-04-02',
    nextVisitDate: '2026-04-16',
    geoTagged: false,
  },
  {
    reportId: 'RPT-0007',
    crpId: 'CRP-1030',
    crpName: 'Ankita Jamatia',
    district: 'Sepahijala',
    block: 'Jampuijala',
    gramPanchayat: 'Jampuijala GP',
    village: 'Jampuijala',
    shgName: 'Ujjwala SHG',
    shgCode: 'USHG-SPJ-07',
    memberName: 'Swapna Jamatia',
    memberCategory: 'ST',
    activityName: 'Turmeric Farming',
    seasonality: 'Kharif',
    totalInvestment: 44500,
    annualIncomeBefore: 41000,
    annualIncomeAfter: 85000,
    progressStatus: 'Completed',
    assignedGeoLocation: '23.8821, 91.4698',
    trackingGeoLocation: '23.8773, 91.4639',
    trackingImage: 'uploaded',
    trackingVideo: 'uploaded',
    checkInDateTime: '2026-04-01 08:55 AM',
    checkOutDateTime: '2026-04-01 10:50 AM',
    visitDate: '2026-04-01',
    nextVisitDate: '2026-04-15',
    geoTagged: true,
  },
  {
    reportId: 'RPT-0008',
    crpId: 'CRP-1031',
    crpName: 'Arti Reang',
    district: 'Unakoti',
    block: 'Kumarghat',
    gramPanchayat: 'Fatikroy GP',
    village: 'Pecharthal',
    shgName: 'Nabajyoti SHG',
    shgCode: 'NSHG-UNK-08',
    memberName: 'Ashalata Reang',
    memberCategory: 'ST',
    activityName: 'Banana Plantation',
    seasonality: 'Perennial',
    totalInvestment: 58500,
    annualIncomeBefore: 47000,
    annualIncomeAfter: 104500,
    progressStatus: 'In Progress',
    assignedGeoLocation: '24.3162, 92.1238',
    trackingGeoLocation: '24.3104, 92.1171',
    trackingImage: 'uploaded',
    trackingVideo: 'not uploaded',
    checkInDateTime: '2026-03-31 09:45 AM',
    checkOutDateTime: '2026-03-31 11:30 AM',
    visitDate: '2026-03-31',
    nextVisitDate: '2026-04-14',
    geoTagged: true,
  },
  {
    reportId: 'RPT-0009',
    crpId: 'CRP-1032',
    crpName: 'Sutapa Saha',
    district: 'West Tripura',
    block: 'Mohanpur',
    gramPanchayat: 'Mohanpur GP',
    village: 'Taranagar',
    shgName: 'Pragati SHG',
    shgCode: 'PSHG-WTP-09',
    memberName: 'Soma Saha',
    memberCategory: 'General',
    activityName: 'Goat Rearing',
    seasonality: 'Perennial',
    totalInvestment: 49500,
    annualIncomeBefore: 43000,
    annualIncomeAfter: 90500,
    progressStatus: 'Under Review',
    assignedGeoLocation: '23.9367, 91.2629',
    trackingGeoLocation: '23.9318, 91.2584',
    trackingImage: 'not uploaded',
    trackingVideo: 'uploaded',
    checkInDateTime: '2026-03-30 10:10 AM',
    checkOutDateTime: '2026-03-30 12:00 PM',
    visitDate: '2026-03-30',
    nextVisitDate: '2026-04-13',
    geoTagged: false,
  },
  {
    reportId: 'RPT-0010',
    crpId: 'CRP-1033',
    crpName: 'Moushumi Debnath',
    district: 'Gomati',
    block: 'Karbook',
    gramPanchayat: 'Karbook GP',
    village: 'East Karbook',
    shgName: 'Maitri SHG',
    shgCode: 'MSHG-GMT-10',
    memberName: 'Bhaswati Debnath',
    memberCategory: 'OBC',
    activityName: 'Duck Farming',
    seasonality: 'All Season',
    totalInvestment: 32500,
    annualIncomeBefore: 35500,
    annualIncomeAfter: 69400,
    progressStatus: 'Completed',
    assignedGeoLocation: '23.4148, 91.7265',
    trackingGeoLocation: '23.4092, 91.7211',
    trackingImage: 'uploaded',
    trackingVideo: 'uploaded',
    checkInDateTime: '2026-03-29 09:25 AM',
    checkOutDateTime: '2026-03-29 11:15 AM',
    visitDate: '2026-03-29',
    nextVisitDate: '2026-04-12',
    geoTagged: true,
  },
];

type ReportSectionKey = 'shg' | 'producerGroup' | 'nonProducerGroup' | 'lhCbo' | 'fpc' | 'chc';

type ReportSection = {
  key: ReportSectionKey;
  label: string;
  csvName: string;
  rows: ReportRecord[];
};

const buildStaticSectionRows = (
  reportPrefix: string,
  codePrefix: string,
  sectionNames: string[],
  activities: string[],
): ReportRecord[] =>
  reportRows.map((row, index) => ({
    ...row,
    reportId: `${reportPrefix}-${String(index + 1).padStart(4, '0')}`,
    shgName: sectionNames[index % sectionNames.length],
    shgCode: `${codePrefix}-${row.district.slice(0, 3).toUpperCase()}-${String(index + 1).padStart(2, '0')}`,
    memberName: row.memberName,
    activityName: activities[index % activities.length],
  }));

const reportSections: ReportSection[] = [
  {
    key: 'shg',
    label: 'SHG',
    csvName: 'trlm-shg-farm-activity-report.csv',
    rows: reportRows,
  },
  {
    key: 'producerGroup',
    label: 'Producer Group',
    csvName: 'trlm-producer-group-report.csv',
    rows: buildStaticSectionRows(
      'PG-RPT',
      'PG',
      ['Matabari Paddy Producer Group', 'Ambassa Vegetable Producer Group', 'Dasda Maize Producer Group'],
      ['Paddy Aggregation', 'Vegetable Cluster Farming', 'Maize Value Chain'],
    ),
  },
  {
    key: 'nonProducerGroup',
    label: 'Non Producer Group',
    csvName: 'trlm-non-producer-group-report.csv',
    rows: buildStaticSectionRows(
      'NPG-RPT',
      'NPG',
      ['Udaipur Skill Group', 'Kulai Service Group', 'Karbook Enterprise Group'],
      ['Tailoring Enterprise', 'Food Processing Unit', 'Retail Support Activity'],
    ),
  },
  {
    key: 'lhCbo',
    label: 'Integrated Farming Cluster (IFC)',
    csvName: 'trlm-integrated-farming-cluster-ifc-report.csv',
    rows: buildStaticSectionRows(
      'IFC-RPT',
      'IFC',
      ['Gomati Integrated Farming Cluster', 'Dhalai Integrated Farming Cluster', 'West Tripura Integrated Farming Cluster'],
      ['Livelihood Planning', 'Enterprise Monitoring', 'Community Resource Support'],
    ),
  },
  {
    key: 'fpc',
    label: 'FPC',
    csvName: 'trlm-fpc-report.csv',
    rows: buildStaticSectionRows(
      'FPC-RPT',
      'FPC',
      ['Tripura Agro FPC', 'Gomati Farmers FPC', 'Khowai Growers FPC'],
      ['Market Linkage', 'Input Supply', 'Collective Procurement'],
    ),
  },
  {
    key: 'chc',
    label: 'CHC',
    csvName: 'trlm-chc-report.csv',
    rows: buildStaticSectionRows(
      'CHC-RPT',
      'CHC',
      ['Matabari Custom Hiring Centre', 'Ambassa CHC', 'Kumarghat CHC'],
      ['Farm Equipment Rental', 'Power Tiller Service', 'Irrigation Pump Service'],
    ),
  },
];

const columnLabels: Record<keyof ReportRecord, string> = {
  reportId: 'Report ID',
  crpId: 'CRP ID',
  crpName: 'CRP Name',
  district: 'District',
  block: 'Block',
  gramPanchayat: 'Gram Panchayat',
  village: 'Village',
  shgName: 'SHG Name',
  shgCode: 'SHG Code',
  memberName: 'Member Name',
  memberCategory: 'Social Category',
  activityName: 'Activity',
  seasonality: 'Season',
  totalInvestment: 'Total Investment',
  annualIncomeBefore: 'Annual Income Before',
  annualIncomeAfter: 'Annual Income After',
  progressStatus: 'Progress Status',
  assignedGeoLocation: 'Assigned Geo Location (Lat, Long)',
  trackingGeoLocation: 'Tracking Geo Location (Lat, Long)',
  trackingImage: 'Tracking Image',
  trackingVideo: 'Tracking Video',
  checkInDateTime: 'Check In Date & Time',
  checkOutDateTime: 'Check Out Date & Time',
  visitDate: 'Visit Date',
  nextVisitDate: 'Next Visit Date',
  geoTagged: 'Geo Tagged',
};

const orderedColumns: Array<keyof ReportRecord> = [
  'reportId',
  'crpId',
  'crpName',
  'district',
  'block',
  'gramPanchayat',
  'village',
  'shgName',
  'shgCode',
  'memberName',
  'memberCategory',
  'activityName',
  'seasonality',
  'totalInvestment',
  'annualIncomeBefore',
  'annualIncomeAfter',
  'progressStatus',
  'assignedGeoLocation',
  'trackingGeoLocation',
  'trackingImage',
  'trackingVideo',
  'checkInDateTime',
  'checkOutDateTime',
  'visitDate',
  'nextVisitDate',
  'geoTagged',
];

const excelLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

type PreviewState =
  | {
      type: 'image' | 'video';
      title: string;
      src: string;
    }
  | null;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

const formatCellValue = (column: keyof ReportRecord, value: ReportRecord[keyof ReportRecord]) => {
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  if (column === 'totalInvestment' || column === 'annualIncomeBefore' || column === 'annualIncomeAfter') {
    return formatCurrency(Number(value));
  }

  return String(value);
};

const toDataUri = (svg: string) => `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

const buildImagePreview = (record: ReportRecord) =>
  toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#d7f0e2"/>
          <stop offset="100%" stop-color="#a8d5ba"/>
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill="url(#bg)"/>
      <rect x="48" y="48" width="864" height="444" rx="26" fill="#ffffff" opacity="0.9"/>
      <text x="90" y="130" font-family="Arial" font-size="34" font-weight="700" fill="#17324a">${record.memberName}</text>
      <text x="90" y="178" font-family="Arial" font-size="22" fill="#4b6478">${record.activityName} - ${record.village}</text>
      <text x="90" y="228" font-family="Arial" font-size="20" fill="#4b6478">Tracking Image Preview</text>
      <text x="90" y="270" font-family="Arial" font-size="20" fill="#4b6478">CRP: ${record.crpName}</text>
      <text x="90" y="312" font-family="Arial" font-size="20" fill="#4b6478">Visited: ${record.visitDate}</text>
      <text x="90" y="354" font-family="Arial" font-size="20" fill="#4b6478">Location: ${record.trackingGeoLocation}</text>
      <circle cx="770" cy="220" r="86" fill="#dff5e7"/>
      <path d="M730 246l44-58 33 42 20-24 47 62z" fill="#2f855a"/>
      <circle cx="742" cy="188" r="16" fill="#89c997"/>
      <text x="90" y="430" font-family="Arial" font-size="18" fill="#60788c">Static demo preview until live media API is connected.</text>
    </svg>
  `);

const buildVideoPreview = (record: ReportRecord) =>
  toDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#17324a"/>
          <stop offset="100%" stop-color="#2b5b80"/>
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill="url(#bg)"/>
      <rect x="70" y="64" width="820" height="412" rx="28" fill="#0f2234" stroke="#6ea9d3" stroke-width="2"/>
      <circle cx="480" cy="270" r="72" fill="#ffffff" opacity="0.92"/>
      <path d="M455 228l68 42-68 42z" fill="#17324a"/>
      <text x="90" y="118" font-family="Arial" font-size="32" font-weight="700" fill="#ffffff">${record.memberName}</text>
      <text x="90" y="162" font-family="Arial" font-size="22" fill="#d6e7f4">Tracking Video Preview - ${record.activityName}</text>
      <text x="90" y="430" font-family="Arial" font-size="18" fill="#d6e7f4">Visit: ${record.visitDate} | Next: ${record.nextVisitDate}</text>
      <text x="90" y="458" font-family="Arial" font-size="18" fill="#d6e7f4">Geo: ${record.trackingGeoLocation}</text>
    </svg>
  `);

const exportCSV = (rowsToExport: ReportRecord[], fileName: string) => {
  const headers = orderedColumns.map((column) => columnLabels[column]);
  const rows = rowsToExport.map((record) =>
    orderedColumns.map((column) => formatCellValue(column, record[column])),
  );

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const Reports: React.FC = () => {
  const [preview, setPreview] = React.useState<PreviewState>(null);
  const [activeSectionKey, setActiveSectionKey] = React.useState<ReportSectionKey>('shg');
  const activeSection = reportSections.find((section) => section.key === activeSectionKey) ?? reportSections[0];
  const activeRows = activeSection.rows;
  const completedCount = activeRows.filter((row) => row.progressStatus === 'Completed').length;
  const geoTaggedCount = activeRows.filter((row) => row.geoTagged).length;

  return (
    <PageShell
      kicker="Reports"
      title={`${activeSection.label} Farm-based Activity Status`}
      subtitle="Excel-style admin report sections with static demo records and CSV download."
    >
      <section className="excel-report-hero page-card">
        <div>
          <span className="excel-report-hero__kicker">Workbook Preview</span>
          <h2>{activeSection.label} Activity Register</h2>
          <p>
            Spreadsheet-style report view for admin review. Select a report section, scroll horizontally,
            inspect the static records, and download the same data as CSV.
          </p>
        </div>
        <div className="excel-report-hero__stats">
          <div>
            <span>Total Records</span>
            <strong>{activeRows.length}</strong>
          </div>
          <div>
            <span>Completed</span>
            <strong>{completedCount}</strong>
          </div>
          <div>
            <span>Geo Tagged</span>
            <strong>{geoTaggedCount}</strong>
          </div>
        </div>
        <div className="excel-report-hero__actions">
          <button
            className="excel-report-btn excel-report-btn--primary"
            type="button"
            onClick={() => exportCSV(activeRows, activeSection.csvName)}
          >
            Download CSV
          </button>
        </div>
      </section>

      <section className="page-card excel-sheet-card">
        <div className="excel-sheet-card__bar">
          <div className="excel-sheet-card__tabs">
            {reportSections.map((section) => (
              <button
                key={section.key}
                className={section.key === activeSectionKey ? 'is-active' : undefined}
                type="button"
                onClick={() => setActiveSectionKey(section.key)}
              >
                {section.label}
              </button>
            ))}
          </div>
          <div className="excel-sheet-card__meta">{activeSection.label} ready to download</div>
        </div>

        <div className="excel-sheet-wrap">
          <table className="excel-sheet">
            <thead>
              <tr className="excel-sheet__letters">
                <th className="excel-sheet__row-index" />
                {orderedColumns.map((_, index) => (
                  <th key={orderedColumns[index]}>{excelLetters[index] || `C${index + 1}`}</th>
                ))}
              </tr>
              <tr className="excel-sheet__headers">
                <th className="excel-sheet__row-index">1</th>
                {orderedColumns.map((column) => (
                  <th key={column}>{columnLabels[column]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeRows.map((record, rowIndex) => (
                <tr key={record.reportId}>
                  <td className="excel-sheet__row-index">{rowIndex + 2}</td>
                  {orderedColumns.map((column) => (
                    <td key={`${record.reportId}-${column}`} data-column={columnLabels[column]}>
                      {column === 'progressStatus' ? (
                        <span className={`excel-chip excel-chip--${String(record[column]).toLowerCase().replace(/\s+/g, '-')}`}>
                          {formatCellValue(column, record[column])}
                        </span>
                      ) : column === 'trackingImage' ? (
                        record.trackingImage === 'uploaded' ? (
                          <button
                            className="excel-preview-btn"
                            type="button"
                            onClick={() =>
                              setPreview({
                                type: 'image',
                                title: `${record.memberName} - Tracking Image`,
                                src: buildImagePreview(record),
                              })
                            }
                          >
                            Preview Image
                          </button>
                        ) : (
                          <span className="excel-chip excel-chip--no">Not Uploaded</span>
                        )
                      ) : column === 'trackingVideo' ? (
                        record.trackingVideo === 'uploaded' ? (
                          <button
                            className="excel-preview-btn"
                            type="button"
                            onClick={() =>
                              setPreview({
                                type: 'video',
                                title: `${record.memberName} - Tracking Video`,
                                src: buildVideoPreview(record),
                              })
                            }
                          >
                            Preview Video
                          </button>
                        ) : (
                          <span className="excel-chip excel-chip--no">Not Uploaded</span>
                        )
                      ) : column === 'geoTagged' ? (
                        <span className={`excel-chip ${record.geoTagged ? 'excel-chip--yes' : 'excel-chip--no'}`}>
                          {formatCellValue(column, record[column])}
                        </span>
                      ) : (
                        formatCellValue(column, record[column])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {preview && (
        <div className="excel-preview-modal" role="dialog" aria-modal="true">
          <div className="excel-preview-modal__backdrop" onClick={() => setPreview(null)} />
          <div className="excel-preview-modal__panel">
            <div className="excel-preview-modal__header">
              <div>
                <span className="excel-preview-modal__kicker">{preview.type === 'image' ? 'Image Preview' : 'Video Preview'}</span>
                <h3>{preview.title}</h3>
              </div>
              <button className="excel-preview-modal__close" type="button" onClick={() => setPreview(null)}>
                Close
              </button>
            </div>
            <div className="excel-preview-modal__body">
              <img src={preview.src} alt={preview.title} className="excel-preview-modal__media" />
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
};

export default Reports;
