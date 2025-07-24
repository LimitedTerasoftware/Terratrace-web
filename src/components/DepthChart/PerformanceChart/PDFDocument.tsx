import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { MachineData, DepthPenalties } from '../../../types/machine';
import { formatCurrency, formatDistance, calculateTotalNetCost, calculateDepthPenaltyBreakdown } from '../../../utils/calculations';
import { FilterState } from '../../../types/survey';
import teralogo from '../../../images/logo/Teraimage.png';
import { format } from 'date-fns';
import RobotoRegular from '../../../fonts/Roboto-Regular.ttf';

Font.register({
  family: 'Roboto',
  src: RobotoRegular,
});


interface PDFDocumentProps {
  data: MachineData;
  filters: FilterState;
  depthPenalties?: DepthPenalties;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: "Roboto",
    paddingBottom:70
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#3b82f6',
  },
  logo: {
    width: 60,
    height: 60,
  },
  headerText: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  headerInfo: {
    textAlign: 'right',
  },
  infoText: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    width: '30%',
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryValueGreen: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  summaryValueRed: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  table: {
    // display: 'table',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  tableHeaderRow: {
    margin: 'auto',
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
  },
  tableColHeader: {
    width: '16.66%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCol: {
    width: '16.66%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderLeftWidth: 0,
    borderTopWidth: 0,
    padding: 8,
  },
  tableCellHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    textAlign: 'center',
  },
  tableCell: {
    fontSize: 9,
    color: '#4b5563',
    textAlign: 'center',
  },
  tableCellGreen: {
    fontSize: 9,
    color: '#059669',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  tableCellRed: {
    fontSize: 9,
    color: '#dc2626',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  performanceStatus: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    textAlign: 'center',
  },
  performanceStatusExcellent: {
    backgroundColor: '#d1fae5',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  performanceStatusGood: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  performanceStatusWarning: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  performanceStatusPenalty: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  statusTextExcellent: {
    color: '#065f46',
  },
  statusTextGood: {
    color: '#166534',
  },
  statusTextWarning: {
    color: '#92400e',
  },
  statusTextPenalty: {
    color: '#991b1b',
  },
  statusDescription: {
    fontSize: 10,
    color: '#6b7280',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    textAlign: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    marginTop:20
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  breakdownSection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 10,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  breakdownLabel: {
    fontSize: 10,
    color: '#4b5563',
  },
  breakdownValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1f2937',
  },
});

const getPerformanceStatus = (distance: number, hasDepthPenalties: boolean = false) => {
  if (distance >= 10) {
    return {
      status: 'excellent',
      message: `Excellent Performance! ${distance} km - Earning incentives${hasDepthPenalties ? ' (Depth penalties apply)' : ''}`,
      style: styles.performanceStatusExcellent,
      textStyle: styles.statusTextExcellent,
    };
  } else if (distance >= 7.5) {
    return {
      status: 'good',
      message: `Good Performance! ${distance} km - Earning incentives${hasDepthPenalties ? ' (Depth penalties apply)' : ''}`,
      style: styles.performanceStatusGood,
      textStyle: styles.statusTextGood,
    };
  } else if (distance >= 5) {
    return {
      status: 'warning',
      message: `Below Target: ${distance} km - Penalty applied${hasDepthPenalties ? ' + Depth penalties' : ''}`,
      style: styles.performanceStatusWarning,
      textStyle: styles.statusTextWarning,
    };
  } else {
    return {
      status: 'penalty',
      message: `Critical: ${distance} km - High penalty applied${hasDepthPenalties ? ' + Depth penalties' : ''}`,
      style: styles.performanceStatusPenalty,
      textStyle: styles.statusTextPenalty,
    };
  }
};

export const PDFDocument: React.FC<PDFDocumentProps> = ({ data, filters, depthPenalties }) => {
  const hasDepthPenalties = depthPenalties && depthPenalties.totalDepthPenalty > 0;
  const performanceStatus = getPerformanceStatus(data.monthlyTotalDistance, hasDepthPenalties);
  const totalNetCost = depthPenalties ? calculateTotalNetCost(data, depthPenalties) : data.netCost;
  const depthBreakdown = depthPenalties ? calculateDepthPenaltyBreakdown(depthPenalties) : null;
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header} fixed>
          <Image style={styles.logo} src={teralogo} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Machine Performance Report</Text>
            <Text style={styles.subtitle}>Comprehensive Performance Analysis</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.infoText}>Machine ID: {filters.machineName}</Text>
            <Text style={styles.infoText}>Period: {monthNames[(filters.month ?? 1) - 1]}  {filters.year}</Text>
            <Text style={styles.infoText}>Generated: {new Date().toLocaleDateString()}</Text>
          </View>
        </View>

        {/* Performance Status */}
        <View style={[styles.performanceStatus, performanceStatus.style]}>
          <Text style={[styles.statusText, performanceStatus.textStyle]}>
            {performanceStatus.message}
          </Text>
          <Text style={styles.statusDescription}>
            Monthly Distance: {formatDistance(data.monthlyTotalDistance)}
            {depthPenalties && ` | Depth Events: ${depthPenalties.totalDepthEvents}`}
          </Text>
        </View>

        {/* Summary Cards */}
      
          <View style={[styles.summaryContainer, { alignItems: 'center' }]}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Machine Rent</Text>
            <Text style={styles.summaryValue}>{formatCurrency(data.machineRent)}</Text>
          </View>
          <Text style={[styles.summaryValue, { fontSize: 24, color: '#6b7280', marginHorizontal: 10 }]}>{data.monthlyPenalty ? '-' : '+'}</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>
              {data.monthlyPenalty ? 'Output Penalty' : 'Output Incentive'}
            </Text>
            <Text style={data.monthlyPenalty ? styles.summaryValueRed : styles.summaryValueGreen}>
              {data.monthlyPenalty 
                ? formatCurrency(data.monthlyPenalty)
                : data.monthlyIncentive 
                  ? formatCurrency(data.monthlyIncentive)
                  : '₹0'
              }
            </Text>
          </View>
          <Text style={[styles.summaryValue, { fontSize: 24, color: '#6b7280', marginHorizontal: 10 }]}>-</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Depth Penalty</Text>
            <Text style={styles.summaryValueRed}>
              {depthPenalties ? formatCurrency(depthPenalties.totalDepthPenalty) : '₹0'}
            </Text>
          </View>
          <Text style={[styles.summaryValue, { fontSize: 24, color: '#6b7280', marginHorizontal: 10 }]}>=</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Net Payable</Text>
            <Text style={totalNetCost > data.machineRent ? styles.summaryValueRed : styles.summaryValueGreen}>
              {formatCurrency(totalNetCost)}
            </Text>
          </View>
        </View>


      {/* Daily Performance Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Performance Data</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Date</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Distance (km)</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Target Met</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Difference</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Depth Events</Text>
              </View>
              <View style={styles.tableColHeader}>
                <Text style={styles.tableCellHeader}>Status</Text>
              </View>
            </View>
            
            {/* Table Rows */}
            {data.dailyDistances.map((day, index) => (
              <View key={day.date} style={styles.tableRow}>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {new Date(day.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>{day.totalDistance.toFixed(2)}</Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={day.meetsDailyRequirement ? styles.tableCellGreen : styles.tableCellRed}>
                    {day.meetsDailyRequirement ? 'Yes' : 'No'}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={day.difference >= 0 ? styles.tableCellGreen : styles.tableCellRed}>
                    {day.difference >= 0 ? '+' : ''}{day.difference.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={styles.tableCell}>
                    {depthPenalties?.details.filter(event => 
                      format(new Date(event.created_at), 'yyyy-MM-dd') === day.date
                    ).length || 0}
                  </Text>
                </View>
                <View style={styles.tableCol}>
                  <Text style={day.meetsDailyRequirement ? styles.tableCellGreen : styles.tableCellRed}>
                    {day.meetsDailyRequirement ? 'Good' : 'Below'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Depth Events Table */}
        {depthPenalties && depthPenalties.details.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Depth Events Data</Text>
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeaderRow}>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Date & Time</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Depth (cm)</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Shortfall</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Penalty Rate</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Location</Text>
                </View>
                <View style={styles.tableColHeader}>
                  <Text style={styles.tableCellHeader}>Status</Text>
                </View>
              </View>
              
              {/* Table Rows */}
              {depthPenalties.details.map((event, index) => {
                const shortfall = Math.max(0, 165 - event.depth);
                const getPenaltyRate = (depth: number) => {
                  if (depth >= 150 && depth <= 164) return '₹500/100m';
                  if (depth >= 120 && depth <= 149) return '₹1100/100m';
                  if (depth < 120) return 'Critical';
                  return 'No Penalty';
                };
                const getStatus = (depth: number) => {
                  if (depth >= 165) return 'Standard';
                  if (depth >= 150) return 'Minor';
                  if (depth >= 120) return 'Major';
                  return 'Critical';
                };
                
                return (
                  <View key={event.id} style={styles.tableRow}>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {format(new Date(event.created_at), 'MMM dd, HH:mm')}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>{event.depth} cm</Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={shortfall > 0 ? styles.tableCellRed : styles.tableCellGreen}>
                        {shortfall > 0 ? `${shortfall.toFixed(0)} cm` : 'None'}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {getPenaltyRate(event.depth)}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {event.latlong}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={event.depth >= 165 ? styles.tableCellGreen : styles.tableCellRed}>
                        {getStatus(event.depth)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          
          </View>
        )}

        {/* Performance Breakdown */}
        <View style={styles.breakdownSection}>
          <Text style={styles.breakdownTitle}>Performance Breakdown</Text>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Total Days Worked:</Text>
            <Text style={styles.breakdownValue}>{data.dailyDistances.length}</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Days Target Met:</Text>
            <Text style={styles.breakdownValue}>
              {data.dailyDistances.filter(d => d.meetsDailyRequirement).length}
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Success Rate:</Text>
            <Text style={styles.breakdownValue}>
              {((data.dailyDistances.filter(d => d.meetsDailyRequirement).length / data.dailyDistances.length) * 100).toFixed(0)}%
            </Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Monthly Target:</Text>
            <Text style={styles.breakdownValue}>7.5 km</Text>
          </View>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Actual Performance:</Text>
            <Text style={styles.breakdownValue}>{formatDistance(data.monthlyTotalDistance)}</Text>
          </View>
          {depthPenalties && (
            <>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Total Depth Events:</Text>
                <Text style={styles.breakdownValue}>{depthPenalties.totalDepthEvents}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Total Depth Shortfall:</Text>
                <Text style={styles.breakdownValue}>
                  {depthPenalties.details.reduce((total, event) => total + Math.max(0, 165 - event.depth), 0).toFixed(0)} cm
                </Text>
              </View>
              {/* <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Depth Penalty:</Text>
                <Text style={styles.breakdownValue}>{formatCurrency(depthPenalties.totalDepthPenalty)}</Text>
              </View> */}
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Standard Depth:</Text>
                <Text style={styles.breakdownValue}>165 cm</Text>
              </View>
              {/* <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>₹500 Penalties (164-150cm):</Text>
                <Text style={styles.breakdownValue}>{depthBreakdown?.penalty500Events || 0}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>₹1100 Penalties (149-120cm):</Text>
                <Text style={styles.breakdownValue}>{depthBreakdown?.penalty1100Events || 0}</Text>
              </View> */}
            </>
          )}
        </View>

         {/* Penalty Breakdown Section */}
        {(data.monthlyPenalty || (depthBreakdown && depthBreakdown.totalDepthPenalty > 0)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Penalty Breakdown</Text>
            <View style={styles.breakdownSection}>
              {data.monthlyPenalty && (
                <>
                  <Text style={styles.breakdownTitle}>Distance Penalty</Text>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Monthly Target:</Text>
                    <Text style={styles.breakdownValue}>7.5 km</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Actual Distance:</Text>
                    <Text style={styles.breakdownValue}>{formatDistance(data.monthlyTotalDistance)}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Shortfall:</Text>
                    <Text style={styles.breakdownValue}>{(7.5 - data.monthlyTotalDistance)} km</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Penalty Rate:</Text>
                    <Text style={styles.breakdownValue}>
                      {data.monthlyTotalDistance >= 5 ? '₹40,000/250m' : '₹42,000/250m'}
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Total Distance Penalty:</Text>
                    <Text style={[styles.breakdownValue, { color: '#dc2626' }]}>{formatCurrency(data.monthlyPenalty)}</Text>
                  </View>
                </>
              )}
              
              {depthBreakdown && depthBreakdown.totalDepthPenalty > 0 && (
                <>
                  {data.monthlyPenalty && <View style={{ marginVertical: 10, borderTopWidth: 1, borderTopColor: '#e5e7eb' }} />}
                  <Text style={styles.breakdownTitle}>Depth Penalty</Text>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Standard Depth:</Text>
                    <Text style={styles.breakdownValue}>165 cm</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Total Depth Events:</Text>
                    <Text style={styles.breakdownValue}>{depthPenalties && depthPenalties.totalDepthEvents}</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>₹500 Penalties (164-150cm):</Text>
                    <Text style={styles.breakdownValue}>{depthBreakdown.penalty500Events} events</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>₹1100 Penalties (149-120cm):</Text>
                    <Text style={styles.breakdownValue}>{depthBreakdown.penalty1100Events} events</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Total Depth Shortfall:</Text>
                    <Text style={styles.breakdownValue}>
                      {depthPenalties && depthPenalties.details.reduce((total, event) => total + Math.max(0, 165 - event.depth), 0).toFixed(0)} cm
                    </Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Total Depth Penalty:</Text>
                    <Text style={[styles.breakdownValue, { color: '#dc2626' }]}>{formatCurrency(depthBreakdown.totalDepthPenalty)}</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            Shop No-8-2-293/82/A, 1107, Road Number 55, CBI Colony, Jubilee Hills, Hyderabad, Telangana 500033
          </Text>
          <Text style={styles.footerText}>
            04023547447.
          </Text>
        </View>
      </Page>
    </Document>
  );
};