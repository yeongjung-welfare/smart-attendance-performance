import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  Button, Paper, Typography, Alert, LinearProgress, Table, TableBody, TableCell, Box,
  TableContainer, TableHead, TableRow, Dialog, DialogTitle, DialogContent, DialogActions, Chip
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { addTeamSubProgramMap } from "../services/teamSubProgramMapAPI";

function TeamSubProgramUploadForm({ onUploadComplete, onClose }) {
  const fileInput = useRef();
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState([]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setResult(null);
    setErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);

      let successCount = 0;
      let failCount = 0;
      const failedRows = [];

      for (const row of json) {
        const 세부사업명 = row["세부사업명"]?.toString().trim();
        const 팀명 = row["팀명"]?.toString().trim();
        const 기능 = row["기능"]?.toString().trim();
        const 단위사업명 = row["단위사업명"]?.toString().trim();

        if (세부사업명 && 팀명 && 기능 && 단위사업명) {
          try {
            await addTeamSubProgramMap(
              {
                subProgramName: 세부사업명,
                teamName: 팀명,
                functionType: 기능,
                mainProgramName: 단위사업명,
              },
              true // 중복 시 덮어쓰기
            );
            successCount++;
          } catch (err) {
            console.error("업로드 실패 - 행 데이터:", row, "오류:", err.message);
            failCount++;
            failedRows.push({ row, error: err.message });
          }
        } else {
          console.error("필수 필드 누락 - 행 데이터:", row);
          failCount++;
          failedRows.push({ row, error: "필수 필드 누락" });
        }
      }

      setResult({ added: successCount, failed: failCount });
      setErrors(failedRows);

      // ✅ 자동 닫기 제거 - 사용자가 직접 닫기
      // if (onUploadComplete) onUploadComplete();
    } catch (err) {
      console.error("업로드 오류:", err);
      setResult({ errorMessage: err.message });
    } finally {
      setUploading(false);
      // ✅ 파일 input 초기화
      if (fileInput.current) {
        fileInput.current.value = '';
      }
    }
  };

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: "100%" }}>
      <Typography variant="h5" gutterBottom sx={{ textAlign: "center", mb: 3 }}>
        팀-세부사업 매핑 업로드
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
        <strong>필수 헤더:</strong> 세부사업명, 팀명, 기능, 단위사업명<br/>
        ※ 중복된 매핑은 자동으로 덮어쓰기됩니다.
      </Typography>

      <Box sx={{ mb: 3, textAlign: "center" }}>
        <input
          type="file"
          ref={fileInput}
          onChange={handleFileUpload}
          accept=".xlsx,.xls,.csv"
          style={{ display: "none" }}
        />
        <Button
          onClick={() => fileInput.current?.click()}
          variant="contained"
          startIcon={<UploadFileIcon />}
          disabled={uploading}
          sx={{ fontSize: { xs: "1rem", sm: "1.1rem" }, py: 1.2, width: { xs: "100%", sm: "auto" } }}
        >
          {uploading ? "업로드 중..." : "엑셀 파일 선택"}
        </Button>
      </Box>

      {uploading && <LinearProgress sx={{ mb: 2 }} />}

      {result && result.added >= 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
            📊 업로드 완료!
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", mb: 1 }}>
            <Chip 
              label={`✅ 성공: ${result.added}건`} 
              color="success" 
              size="small" 
            />
            {result.failed > 0 && (
              <Chip 
                label={`❌ 실패: ${result.failed}건`} 
                color="error" 
                size="small" 
              />
            )}
          </Box>
          {result.added > 0 && (
            <Typography variant="body2" sx={{ mt: 1, color: "success.dark" }}>
              💡 업로드된 팀-세부사업 매핑이 시스템에 등록되었습니다.
            </Typography>
          )}
          {result.added > 0 && (
            <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: "success.main" }}>
              🎉 아래 "완료" 버튼을 눌러 결과를 확인하세요!
            </Typography>
          )}
        </Alert>
      )}

      {result?.errorMessage && (
        <Alert severity="error" sx={{ mb: 2 }}>
          ⚠️ 업로드 실패: {result.errorMessage}
        </Alert>
      )}

      {/* ✅ 오류 안내 Alert 추가 */}
      {errors.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ⚠️ {errors.length}건의 오류가 발생했습니다. 아래 표에서 확인하세요.
          </Typography>
        </Alert>
      )}

      {errors.length > 0 && (
        <TableContainer component={Paper} sx={{ mb: 2, maxHeight: 300 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>행 정보</TableCell>
                <TableCell>오류 내용</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {errors.map((e, i) => (
                <TableRow key={i}>
                  <TableCell>{JSON.stringify(e.row)}</TableCell>
                  <TableCell>{e.error}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: "center" }}>
        <strong>업로드 파일 형식 안내 (헤더명 일치 필수)</strong><br/>
        세부사업명,팀명,기능,단위사업명<br/>
        이미용 서비스,마을돌봄팀,서비스제공 기능,일상생활지원<br/>
        경로식당,마을돌봄팀,서비스제공 기능,저소득 어르신 무료급식지원사업
      </Typography>

      {onClose && (
        <Box sx={{ textAlign: "center", mt: 2 }}>
          <Button 
            onClick={() => {
              onClose();
              if (result?.added > 0 && onUploadComplete) {
                onUploadComplete(); // 성공적으로 업로드된 경우에만 onUploadComplete 호출
              }
            }} 
            variant={result?.added > 0 ? "contained" : "outlined"}
            color={result?.added > 0 ? "success" : "primary"}
            size="large"
            sx={{ minWidth: 120 }}
          >
            {result?.added > 0 ? "✅ 완료" : "닫기"}
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default TeamSubProgramUploadForm;