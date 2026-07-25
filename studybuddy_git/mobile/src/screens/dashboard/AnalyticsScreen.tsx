import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { useTheme } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Path, Line, Text as SvgText, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface AnalyticsScreenProps {
    onBack?: () => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({ onBack }) => {
    const { colors, typography, borderRadius, shadows, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const [timeframe, setTimeframe] = useState<'weekly' | 'monthly'>('weekly');

    // Mock Data for Charts
    const studyHoursData = timeframe === 'weekly' 
        ? [2.5, 4.0, 1.5, 5.0, 3.2, 2.8, 4.5] // Mon - Sun
        : [14.2, 18.5, 12.0, 16.2]; // Weeks 1 - 4
    
    const studyHoursLabels = timeframe === 'weekly'
        ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        : ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];

    const subjectAccuracyData = [
        { subject: 'Math', score: 85, color: '#4F46E5', icon: 'calculator' },
        { subject: 'Physics', score: 68, color: '#8B5CF6', icon: 'atom' },
        { subject: 'Chem', score: 72, color: '#06B6D4', icon: 'flask' },
        { subject: 'Coding', score: 92, color: '#22C55E', icon: 'code-braces' },
        { subject: 'AI', score: 78, color: '#F59E0B', icon: 'robot-outline' },
    ];

    // Helper to render custom SVG Line Chart (Study Hours Trend)
    const renderLineChart = () => {
        const chartWidth = width - 48; // padding of parent card
        const chartHeight = 160;
        const padding = 25;
        const graphWidth = chartWidth - padding * 2;
        const graphHeight = chartHeight - padding * 2;

        const maxVal = Math.max(...studyHoursData, 6); // at least 6h for scale
        
        // Generate coordinates
        const points = studyHoursData.map((val, index) => {
            const x = padding + (index / (studyHoursData.length - 1)) * graphWidth;
            const y = padding + graphHeight - (val / maxVal) * graphHeight;
            return { x, y, val };
        });

        // Create line path string
        let pathD = '';
        let areaD = '';

        if (points.length > 0) {
            pathD = `M ${points[0].x} ${points[0].y}`;
            areaD = `M ${points[0].x} ${padding + graphHeight} L ${points[0].x} ${points[0].y}`;

            for (let i = 1; i < points.length; i++) {
                // Smooth cubic bezier calculation
                const cpX1 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
                const cpY1 = points[i-1].y;
                const cpX2 = points[i-1].x + (points[i].x - points[i-1].x) / 2;
                const cpY2 = points[i].y;
                
                pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
                areaD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${points[i].x} ${points[i].y}`;
            }

            areaD += ` L ${points[points.length - 1].x} ${padding + graphHeight} Z`;
        }

        return (
            <View style={styles.chartContainer}>
                <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                        <LinearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <Stop offset="0%" stopColor="#4F46E5" />
                            <Stop offset="100%" stopColor="#8B5CF6" />
                        </LinearGradient>
                        <LinearGradient id="areaGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <Stop offset="0%" stopColor="#4F46E5" stopOpacity="0.25" />
                            <Stop offset="100%" stopColor="#4F46E5" stopOpacity="0.00" />
                        </LinearGradient>
                    </Defs>

                    {/* Y Axis Grid lines */}
                    {[0, 0.5, 1].map((ratio, index) => {
                        const y = padding + graphHeight * ratio;
                        const labelValue = (maxVal * (1 - ratio)).toFixed(1);
                        return (
                            <React.Fragment key={index}>
                                <Line
                                    x1={padding}
                                    y1={y}
                                    x2={chartWidth - padding}
                                    y2={y}
                                    stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                    strokeWidth={1}
                                    strokeDasharray="4 4"
                                />
                                <SvgText
                                    x={padding - 6}
                                    y={y + 4}
                                    fill={colors.textMuted}
                                    fontSize="9"
                                    fontWeight="600"
                                    textAnchor="end"
                                >
                                    {labelValue}h
                                </SvgText>
                            </React.Fragment>
                        );
                    })}

                    {/* Area Under Curve */}
                    {areaD ? <Path d={areaD} fill="url(#areaGrad)" /> : null}

                    {/* Main Line Stroke */}
                    {pathD ? (
                        <Path
                            d={pathD}
                            fill="none"
                            stroke="url(#lineGrad)"
                            strokeWidth={3}
                            strokeLinecap="round"
                        />
                    ) : null}

                    {/* Interactive Circles & Value Labels */}
                    {points.map((pt, i) => (
                        <React.Fragment key={i}>
                            <Circle
                                cx={pt.x}
                                cy={pt.y}
                                r={4}
                                fill={colors.card}
                                stroke="#8B5CF6"
                                strokeWidth={2}
                            />
                            {/* Render value on hover/marker */}
                            <SvgText
                                x={pt.x}
                                y={pt.y - 8}
                                fill={colors.text}
                                fontSize="9"
                                fontWeight="700"
                                textAnchor="middle"
                            >
                                {pt.val.toFixed(1)}
                            </SvgText>
                            {/* X Axis Labels */}
                            <SvgText
                                x={pt.x}
                                y={chartHeight - 4}
                                fill={colors.textMuted}
                                fontSize="9"
                                fontWeight="700"
                                textAnchor="middle"
                            >
                                {studyHoursLabels[i]}
                            </SvgText>
                        </React.Fragment>
                    ))}
                </Svg>
            </View>
        );
    };

    // Helper to render custom SVG Bar Chart (Subject accuracy)
    const renderBarChart = () => {
        const chartWidth = width - 48;
        const chartHeight = 160;
        const padding = 25;
        const graphWidth = chartWidth - padding * 2;
        const graphHeight = chartHeight - padding * 2;

        const barSpacing = graphWidth / subjectAccuracyData.length;
        const barWidth = 20;

        return (
            <View style={styles.chartContainer}>
                <Svg width={chartWidth} height={chartHeight}>
                    <Defs>
                        {subjectAccuracyData.map((data, index) => (
                            <LinearGradient key={index} id={`barGrad-${index}`} x1="0%" y1="100%" x2="0%" y2="0%">
                                <Stop offset="0%" stopColor={data.color} stopOpacity="0.4" />
                                <Stop offset="100%" stopColor={data.color} />
                            </LinearGradient>
                        ))}
                    </Defs>

                    {/* Y Axis grid guides */}
                    {[0, 0.5, 1].map((ratio, index) => {
                        const y = padding + graphHeight * ratio;
                        const labelValue = Math.round(100 * (1 - ratio));
                        return (
                            <React.Fragment key={index}>
                                <Line
                                    x1={padding}
                                    y1={y}
                                    x2={chartWidth - padding}
                                    y2={y}
                                    stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
                                    strokeWidth={1}
                                />
                                <SvgText
                                    x={padding - 6}
                                    y={y + 4}
                                    fill={colors.textMuted}
                                    fontSize="9"
                                    fontWeight="600"
                                    textAnchor="end"
                                >
                                    {labelValue}%
                                </SvgText>
                            </React.Fragment>
                        );
                    })}

                    {/* Draw Bars */}
                    {subjectAccuracyData.map((data, index) => {
                        const x = padding + index * barSpacing + (barSpacing - barWidth) / 2;
                        const valHeight = (data.score / 100) * graphHeight;
                        const y = padding + graphHeight - valHeight;

                        return (
                            <React.Fragment key={index}>
                                {/* Bar */}
                                <Rect
                                    x={x}
                                    y={y}
                                    width={barWidth}
                                    height={valHeight}
                                    fill={`url(#barGrad-${index})`}
                                    rx={4}
                                    ry={4}
                                />
                                {/* Value Label */}
                                <SvgText
                                    x={x + barWidth / 2}
                                    y={y - 6}
                                    fill={colors.text}
                                    fontSize="9"
                                    fontWeight="800"
                                    textAnchor="middle"
                                >
                                    {data.score}%
                                </SvgText>
                                {/* X Label */}
                                <SvgText
                                    x={x + barWidth / 2}
                                    y={chartHeight - 4}
                                    fill={colors.textMuted}
                                    fontSize="9"
                                    fontWeight="700"
                                    textAnchor="middle"
                                >
                                    {data.subject}
                                </SvgText>
                            </React.Fragment>
                        );
                    })}
                </Svg>
            </View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background, paddingTop: onBack ? insets.top : 0 }]}>
            {onBack && (
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                    <TouchableOpacity
                        onPress={onBack}
                        style={styles.backButton}
                        accessibilityRole="button"
                        accessibilityLabel="Go back"
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: colors.text, fontSize: typography.fontSize.md }]}>
                        Behavior Analytics
                    </Text>
                    <View style={styles.backButton} />
                </View>
            )}

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: onBack ? 16 : Math.max(insets.top, 24) }
                ]}
                showsVerticalScrollIndicator={false}
            >
                {!onBack && (
                    <Text style={[styles.title, { color: colors.text, fontSize: typography.fontSize.xl + 2 }]}>
                        Behavior Analytics
                    </Text>
                )}
                <Text style={[styles.subtitle, { color: colors.textMuted, fontSize: typography.fontSize.sm, marginTop: onBack ? 0 : 4 }]}>
                    Deep dive into your focus trends, accuracy scores, and performance history.
                </Text>

            {/* --- TIMEFRAME SELECTOR --- */}
            <View style={[styles.timeframeBar, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.round }]}>
                <TouchableOpacity
                    onPress={() => setTimeframe('weekly')}
                    style={[
                        styles.timeframeButton,
                        {
                            backgroundColor: timeframe === 'weekly' ? colors.primary : 'transparent',
                            borderRadius: borderRadius.round,
                        }
                    ]}
                >
                    <Text style={[styles.timeframeText, { color: timeframe === 'weekly' ? '#FFFFFF' : colors.textMuted }]}>
                        Weekly Stats
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setTimeframe('monthly')}
                    style={[
                        styles.timeframeButton,
                        {
                            backgroundColor: timeframe === 'monthly' ? colors.primary : 'transparent',
                            borderRadius: borderRadius.round,
                        }
                    ]}
                >
                    <Text style={[styles.timeframeText, { color: timeframe === 'monthly' ? '#FFFFFF' : colors.textMuted }]}>
                        Monthly Stats
                    </Text>
                </TouchableOpacity>
            </View>

            {/* --- ANALYTICS CARDS ROW --- */}
            <View style={styles.metricsRow}>
                <View style={[styles.metricBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Total Duration</Text>
                    <Text style={[styles.metricVal, { color: colors.text }]}>
                        {timeframe === 'weekly' ? '23.5 hrs' : '86.2 hrs'}
                    </Text>
                    <Text style={[styles.metricTrend, { color: colors.accent }]}>
                        <MaterialCommunityIcons name="trending-up" size={12} /> +12% this wk
                    </Text>
                </View>
                <View style={[styles.metricBox, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
                    <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Daily Average</Text>
                    <Text style={[styles.metricVal, { color: colors.text }]}>
                        {timeframe === 'weekly' ? '3.3 hrs' : '2.8 hrs'}
                    </Text>
                    <Text style={[styles.metricTrend, { color: colors.accent }]}>
                        <MaterialCommunityIcons name="trending-up" size={12} /> +0.5 hrs/d
                    </Text>
                </View>
            </View>

            {/* --- STUDY HOURS TREND --- */}
            <Text style={[styles.sectionHeading, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                {timeframe === 'weekly' ? 'Study Hours (Mon - Sun)' : 'Weekly Performance (Weeks 1 - 4)'}
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }, shadows]}>
                {renderLineChart()}
            </View>

            {/* --- QUIZ ACCURACY CHART --- */}
            <Text style={[styles.sectionHeading, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                Quiz Accuracy per Subject
            </Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }, shadows]}>
                {renderBarChart()}
            </View>

            {/* --- SUBJECT SYLLABUS COMPLETION --- */}
            <Text style={[styles.sectionHeading, { color: colors.text, fontSize: typography.fontSize.md + 1 }]}>
                Syllabus Progress Ring Breakdown
            </Text>
            <View style={[styles.progressCard, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: borderRadius.xl }, shadows]}>
                {subjectAccuracyData.map((data, idx) => (
                    <View key={idx} style={[styles.subjectProgressRow, { borderBottomColor: colors.border }]}>
                        <View style={styles.subjProgressLeft}>
                            <View style={[styles.subjIconWrap, { backgroundColor: `${data.color}15` }]}>
                                <MaterialCommunityIcons name={data.icon as any} size={20} color={data.color} />
                            </View>
                            <View style={styles.subjNameContainer}>
                                <Text style={[styles.subjNameText, { color: colors.text }]}>{data.subject} Completion</Text>
                                <Text style={[styles.subjMutedText, { color: colors.textMuted }]}>Syllabus coverage</Text>
                            </View>
                        </View>
                        <View style={styles.subjProgressRight}>
                            <Text style={[styles.subjScoreText, { color: data.color }]}>{data.score}%</Text>
                            <View style={[styles.miniBarTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
                                <View style={[styles.miniBarFill, { width: `${data.score}%`, backgroundColor: data.color }]} />
                            </View>
                        </View>
                    </View>
                ))}
            </View>

        </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 8,
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontWeight: '800',
        letterSpacing: -0.2,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 110,
    },
    title: {
        fontWeight: '900',
        letterSpacing: -0.6,
    },
    subtitle: {
        fontWeight: '500',
        marginTop: 4,
        marginBottom: 16,
        lineHeight: 18,
    },
    timeframeBar: {
        flexDirection: 'row',
        padding: 4,
        borderWidth: 1,
        marginBottom: 20,
    },
    timeframeButton: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeframeText: {
        fontSize: 13,
        fontWeight: '700',
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginBottom: 20,
    },
    metricBox: {
        flex: 1,
        padding: 14,
        borderWidth: 1,
    },
    metricLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    metricVal: {
        fontSize: 20,
        fontWeight: '800',
        marginTop: 6,
        letterSpacing: -0.3,
    },
    metricTrend: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 4,
    },
    sectionHeading: {
        fontWeight: '800',
        letterSpacing: -0.2,
        marginTop: 8,
        marginBottom: 12,
    },
    card: {
        padding: 14,
        borderWidth: 1.5,
        marginBottom: 20,
        alignItems: 'center',
    },
    chartContainer: {
        marginTop: 10,
    },
    progressCard: {
        borderWidth: 1.5,
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    subjectProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    subjProgressLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    subjIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subjNameContainer: {
        justifyContent: 'center',
    },
    subjNameText: {
        fontSize: 13,
        fontWeight: '700',
    },
    subjMutedText: {
        fontSize: 10,
        fontWeight: '500',
        marginTop: 2,
    },
    subjProgressRight: {
        alignItems: 'flex-end',
        width: 100,
    },
    subjScoreText: {
        fontSize: 13,
        fontWeight: '800',
        marginBottom: 4,
    },
    miniBarTrack: {
        width: '100%',
        height: 5,
        borderRadius: 2.5,
        overflow: 'hidden',
    },
    miniBarFill: {
        height: '100%',
        borderRadius: 2.5,
    },
});

export default AnalyticsScreen;
