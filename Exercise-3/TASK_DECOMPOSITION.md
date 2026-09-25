# TASK_DECOMPOSITION.md

## Component: Resilient Data List

Component hiển thị một danh sách dữ liệu lấy từ nguồn bên ngoài (API/fetch).
Component phải luôn ở đúng một trong bốn trạng thái dưới đây — không được để
hai trạng thái hiển thị cùng lúc.

---

## 1. Danh sách trạng thái (States)

| State     | Mô tả                                              | Hiển thị gì |
|-----------|-----------------------------------------------------|-------------|
| `loading` | Đang chờ dữ liệu trả về                              | Skeleton shimmer, số lượng khối placeholder cố định |
| `success` | Dữ liệu trả về và có ít nhất 1 phần tử               | Metadata badges (Flexbox) + danh sách item (Grid) |
| `empty`   | Dữ liệu trả về thành công nhưng mảng rỗng (0 phần tử) | Thông báo trung tính + gợi ý hành động (không phải lỗi) |
| `error`   | Request thất bại (network lỗi, server lỗi, timeout) | Thông báo lỗi + nút **Retry** có thể thao tác bằng bàn phím |

**Lưu ý phân biệt `empty` và `error`:** đây là lỗi hay gặp nhất khi làm ẩu —
`empty` nghĩa là request **thành công** nhưng không có dữ liệu (ví dụ: user
chưa tạo project nào). `error` nghĩa là request **thất bại**. Hai trạng thái
này phải xử lý ở hai nhánh code khác nhau, không được gộp chung một điều
kiện `if (!data)`.

---

## 2. Sơ đồ chuyển trạng thái (State Machine Diagram)

```
                    ┌─────────────┐
        (mount) ───▶│   loading   │
                    └──────┬──────┘
                           │ fetch() resolves
              ┌────────────┼────────────┐
              │                         │
   data.length > 0              data.length === 0
              │                         │
              ▼                         ▼
       ┌─────────────┐           ┌─────────────┐
       │   success   │           │    empty    │
       └──────┬──────┘           └──────┬──────┘
              │                         │
       (retry / refetch)         (retry / refetch)
              │                         │
              └────────────┬────────────┘
                            ▼
                      ┌─────────────┐
                      │   loading   │ (quay lại vòng lặp)
                      └─────────────┘

   fetch() rejects (từ bất kỳ đâu trong quá trình loading)
                            │
                            ▼
                      ┌─────────────┐
                      │    error    │
                      └──────┬──────┘
                            │ user click "Retry"
                            ▼
                      ┌─────────────┐
                      │   loading   │
                      └─────────────┘
```

---

## 3. Bảng chuyển trạng thái (Transition Table)

| Từ state  | Sự kiện (Event)                    | Sang state | Điều kiện |
|-----------|-------------------------------------|------------|-----------|
| (khởi tạo) | Component mount                     | `loading`  | — |
| `loading` | `fetch` resolve, `data.length > 0`  | `success`  | — |
| `loading` | `fetch` resolve, `data.length === 0`| `empty`    | — |
| `loading` | `fetch` reject / network error       | `error`    | — |
| `success` | User trigger refetch (nếu có)        | `loading`  | — |
| `empty`   | User click nút hành động (nếu có)    | `loading`  | — |
| `error`   | User click nút **Retry**             | `loading`  | — |

**Quy tắc bất biến (invariant):** tại mọi thời điểm, chỉ đúng một khối DOM
tương ứng với state hiện tại được render — dùng 1 biến state duy nhất
(`currentState`) làm nguồn chân lý (single source of truth), không dùng
nhiều biến boolean rời rạc (`isLoading`, `hasError`, `isEmpty`...) vì dễ dẫn
đến trạng thái mâu thuẫn (ví dụ `isLoading = true` và `hasError = true` cùng
lúc).

---

## 4. Đặc tả từng trạng thái (chi tiết cho từng sub-task commit)

### T-03A — `loading` (Loading Skeleton)
- Kỹ thuật: CSS thuần, gradient shimmer chạy bằng `@keyframes`.
- Số lượng khối skeleton: cố định (ví dụ 3-5 khối) để tránh layout shift khi
  chuyển sang `success`.
- Không chứa dữ liệu thật, không có tương tác (không focus được).
- Accessibility: `aria-busy="true"` trên container, `aria-live="polite"`
  không đọc nội dung skeleton (dùng `aria-hidden="true"` trên các khối giả).

### T-03B — `success` (Live Data State)
- Metadata badges: xếp bằng **Flexbox** (`display: flex; flex-wrap: wrap`) —
  vì số lượng badge thay đổi tuỳ item, cần tự xuống dòng.
- Danh sách item: xếp bằng **Grid** (`display: grid`) — vì cần căn đều theo
  cột cố định.
- Mỗi item phải có key/id duy nhất để tránh lỗi re-render.

### T-03C — `empty` & `error`
**Empty:**
- Không phải lỗi — giọng điệu trung tính, mang tính gợi ý hành động tiếp
  theo (ví dụ: "Chưa có dữ liệu nào. Tạo mục đầu tiên?").
- Có thể có nút hành động, nhưng không bắt buộc là "Retry".

**Error:**
- Thông báo rõ ràng nguyên nhân ở mức người dùng hiểu được (không lộ
  stack trace).
- Nút **Retry** bắt buộc phải:
  - Là phần tử `<button>` thật (không dùng `<div onclick>`).
  - Focus được bằng phím Tab, kích hoạt được bằng phím Enter/Space.
  - Có `aria-label` hoặc text rõ ràng mô tả hành động (ví dụ:
    "Retry loading list").
  - Khi click, đưa state quay lại `loading` — không tự ý thử lại ngầm
    (silent auto-retry) để tránh gây bối rối cho người dùng.
- Vùng thông báo lỗi nên có `role="alert"` để screen reader đọc ngay khi
  xuất hiện.

---

## 5. Ràng buộc khi triển khai (Contract-first constraints)

- Container gốc có **1 thuộc tính duy nhất** phản ánh state hiện tại, ví dụ
  `data-state="loading|success|empty|error"`.
- CSS chỉ hiển thị đúng 1 khối con tương ứng `data-state` — dùng
  `[data-state="x"] .block-x { display: ... }`, các khối khác `display: none`.
- Không có JS nào được phép set `display` trực tiếp qua inline style —
  JS chỉ đổi `data-state`, CSS chịu trách nhiệm hiển thị/ẩn.

---

## 6. Quy tắc prompt AI (bắt buộc theo đề bài)

- File này phải hoàn thành **trước** khi mở bất kỳ công cụ AI nào để hỗ
  trợ code.
- Không prompt AI để sinh code cho cả 4 trạng thái trong 1 lần.
- Thứ tự prompt AI tương ứng đúng thứ tự commit:
  1. Prompt riêng cho `loading` → commit `feat(css): skeleton`
  2. Prompt riêng cho `success` → commit `feat(css): live-data-layout` (hoặc
     tên tương ứng)
  3. Prompt riêng cho `empty` + `error` → commit `feat(js): empty-error-states`
