import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tabs,
  Tab,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  Paper,
  CircularProgress,
  Card,
  CardContent
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import HistoryIcon from '@mui/icons-material/History';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { fetchPerformances, fetchAttendances } from "../services/attendancePerformanceAPI";
import { db } from '../firebase';

function MemberServiceModal({ open, onClose, member }) {
  const [currentTab, setCurrentTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serviceData, setServiceData] = useState({
    currentServices: [],
    serviceHistory: [],
    attendanceStats: {
      totalRecords: 0,
      attendedDays: 0,
      absentDays: 0,
      attendanceRate: 0
    },
    performanceStats: {
      totalRecords: 0,
      individualRecords: 0,
      bulkRecords: 0
    }
  });

  useEffect(() => {
    if (member && open) {
      loadMemberServices(member.id, member.name);
    }
  }, [member, open]);

  const loadMemberServices = async (memberId, memberName) => {
  setLoading(true);
  try {
    const userKey = member.userId || member.고유아이디 || memberId;

    // 1. 현재 이용 중인 서비스
    const currentServicesQuery = query(
      collection(db, 'SubProgramUsers'),
      where('고유아이디', '==', userKey),
      where('이용자명', '==', memberName), // ✅ 보조조건
      where('이용상태', '==', '이용')
    );
    const currentServicesSnapshot = await getDocs(currentServicesQuery);
    const currentServices = currentServicesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 2. 서비스 이력
    const serviceHistoryQuery = query(
      collection(db, 'SubProgramUsers'),
      where('고유아이디', '==', userKey),
      where('이용자명', '==', memberName), // ✅ 보조조건
      where('이용상태', '==', '종결')
    );
    const serviceHistorySnapshot = await getDocs(serviceHistoryQuery);
    const serviceHistory = serviceHistorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 3. 출석 통계
    const attendanceQuery = query(
      collection(db, 'AttendanceRecords'),
      where('고유아이디', '==', userKey),
      where('이용자명', '==', memberName) // ✅ 보조조건
    );
    const attendanceSnapshot = await getDocs(attendanceQuery);
    const attendanceRecords = attendanceSnapshot.docs.map(doc => doc.data());

    const totalRecords = attendanceRecords.length;
    const attendedDays = attendanceRecords.filter(record => record.출석여부 === true).length;
    const absentDays = totalRecords - attendedDays;
    const attendanceRate = totalRecords > 0 ? Math.round((attendedDays / totalRecords) * 100) : 0;

    // 4. 실적 통계
    const performanceQuery = query(
      collection(db, 'PerformanceSummary'),
      where('고유아이디', '==', userKey),
      where('이용자명', '==', memberName) // ✅ 보조조건
    );
    const performanceSnapshot = await getDocs(performanceQuery);
    const performanceRecords = performanceSnapshot.docs.map(doc => doc.data());

    const totalPerformanceRecords = performanceRecords.length;
    const individualRecords = performanceRecords.filter(record => record.실적유형 === '개별').length;
    const bulkRecords = performanceRecords.filter(record => record.실적유형 === '대량').length;

    setServiceData({
      currentServices,
      serviceHistory,
      attendanceStats: {
        totalRecords,
        attendedDays,
        absentDays,
        attendanceRate,
        recentRecords: attendanceRecords
          .sort((a, b) => new Date(b.날짜) - new Date(a.날짜))
          .slice(0, 5)
      },
      performanceStats: {
        totalRecords: totalPerformanceRecords,
        individualRecords,
        bulkRecords,
        recentRecords: performanceRecords
          .sort((a, b) => new Date(b.날짜) - new Date(a.날짜))
          .slice(0, 5)
      }
    });

  } catch (error) {
    console.error('서비스 데이터 로드 오류:', error);
  } finally {
    setLoading(false);
  }
};

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const getStatusColor = (status) => {
    return status === '이용' ? 'primary' : 'default';
  };

  if (!member) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1}>
          <PersonIcon color="primary" />
          <Typography variant="h6">
            {member.name}님의 서비스 이용 현황
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          생년월일: {member.birthdate} | 연령대: {member.ageGroup} | 연락처: {member.phone}
        </Typography>
      </DialogTitle>
      
      <DialogContent sx={{ minHeight: 500 }}>
        {loading ? (
          <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" p={5}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="body1">서비스 정보를 불러오는 중...</Typography>
          </Box>
        ) : (
          <>
            <Tabs 
              value={currentTab} 
              onChange={handleTabChange} 
              sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
              variant="fullWidth"
            >
              <Tab 
                icon={<PersonIcon />} 
                label="현재 이용 서비스" 
                iconPosition="start"
              />
              <Tab 
                icon={<HistoryIcon />} 
                label="서비스 이력" 
                iconPosition="start"
              />
              <Tab 
                icon={<EventAvailableIcon />} 
                label="출석 통계" 
                iconPosition="start"
              />
              <Tab 
                icon={<AssignmentTurnedInIcon />} 
                label="실적 통계" 
                iconPosition="start"
              />
            </Tabs>

            {currentTab === 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  현재 이용 중인 서비스 ({serviceData.currentServices.length}개)
                </Typography>
                {serviceData.currentServices.length > 0 ? (
                  <Grid container spacing={2}>
                    {serviceData.currentServices.map((service) => (
                      <Grid item xs={12} md={6} key={service.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                              <Typography variant="h6" component="div">
                                {service.세부사업명}
                              </Typography>
                              <Chip 
                                label={service.이용상태} 
                                color={getStatusColor(service.이용상태)} 
                                size="small" 
                              />
                            </Box>
                            <Typography color="text.secondary" gutterBottom>
                              팀명: {service.팀명}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              단위사업: {service.단위사업명}
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              소득구분: {service.소득구분}
                            </Typography>
                            <Typography variant="body2">
                              유료/무료: {service.유료무료}
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      현재 이용 중인 서비스가 없습니다.
                    </Typography>
                  </Paper>
                )}
              </Box>
            )}

            {currentTab === 1 && (
  <Box>
    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
      서비스 이용 이력 ({serviceData.serviceHistory.length}개)
    </Typography>
    {serviceData.serviceHistory.length > 0 ? (
      <List>
        {serviceData.serviceHistory.map((service, index) => (
          <ListItem key={service.id} alignItems="flex-start" sx={{ px: 0 }}>
            <Box sx={{ width: '100%' }}>
              {/* Primary 영역 */}
              <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="h6" component="div">
                  {service.세부사업명}
                </Typography>
                <Chip 
                  label={service.이용상태} 
                  color={getStatusColor(service.이용상태)} 
                  size="small" 
                />
              </Box>
              
              {/* Secondary 영역 */}
              <Box sx={{ pl: 0 }}>
                <Typography variant="body2" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
                  팀명: {service.팀명} | 단위사업: {service.단위사업명}
                </Typography>
                <Typography variant="body2" color="text.secondary" component="div">
                  등록일: {service.createdAt}
                </Typography>
              </Box>
            </Box>
          </ListItem>
        ))}
      </List>
    ) : (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="text.secondary">
          과거 서비스 이용 이력이 없습니다.
        </Typography>
      </Paper>
    )}
  </Box>
)}

            {currentTab === 2 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  출석 통계
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                      <Typography variant="h4" color="primary.main">
                        {serviceData.attendanceStats.totalRecords}
                      </Typography>
                      <Typography variant="caption">총 기록</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                      <Typography variant="h4" color="success.main">
                        {serviceData.attendanceStats.attendedDays}
                      </Typography>
                      <Typography variant="caption">출석</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'error.50' }}>
                      <Typography variant="h4" color="error.main">
                        {serviceData.attendanceStats.absentDays}
                      </Typography>
                      <Typography variant="caption">결석</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'info.50' }}>
                      <Typography variant="h4" color="info.main">
                        {serviceData.attendanceStats.attendanceRate}%
                      </Typography>
                      <Typography variant="caption">출석률</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}

            {currentTab === 3 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
                  실적 통계
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'primary.50' }}>
                      <Typography variant="h4" color="primary.main">
                        {serviceData.performanceStats.totalRecords}
                      </Typography>
                      <Typography variant="caption">전체 실적</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'success.50' }}>
                      <Typography variant="h4" color="success.main">
                        {serviceData.performanceStats.individualRecords}
                      </Typography>
                      <Typography variant="caption">개별 실적</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={4}>
                    <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'warning.50' }}>
                      <Typography variant="h4" color="warning.main">
                        {serviceData.performanceStats.bulkRecords}
                      </Typography>
                      <Typography variant="caption">대량 실적</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} size="large">
          닫기
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default MemberServiceModal;
