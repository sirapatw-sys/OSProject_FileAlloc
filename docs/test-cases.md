# Test Cases & Verification Suite
## FileAlloc: File System Block Allocation Visualizer

เอกสารชุดกรณีทดสอบนี้จัดทำขึ้นโดย **โชกุน** สำหรับใช้เป็นคู่มือทดสอบระบบ FileAlloc อย่างเป็นขั้นตอน (Step-by-step) ครอบคลุมทั้งกรณีการทำงานปกติ (Happy Path), การตรวจสอบความถูกต้องของข้อมูล (Input Validation), ขอบเขตและทรัพยากร (Edge Cases & Limits), และการคงสภาพของระบบ (System Invariants)

---

## 1. ภาพรวมและสภาพแวดล้อมการทดสอบ (Test Overview & Environment)

- **แพลตฟอร์ม**: Modern Web Browser (Google Chrome, Microsoft Edge, Firefox หรือ Safari)
- **การเข้าถึงระบบ**: เปิดไฟล์ `index.html` บนเว็บเบราว์เซอร์โดยตรง (ไม่ต้องติดตั้งโปรแกรมหรือรันเซิร์ฟเวอร์)
- **สถานะเริ่มต้น (Initial State)**:
  - Total Blocks: `64`
  - Used Blocks: `0`
  - Free Blocks: `64`
  - บล็อก ID `0` ถึง `63` มีสถานะว่าง (Free) ทุกบล็อก

---

## 2. ตารางสรุปกรณีทดสอบ (Test Execution Matrix)

| Test ID | หมวดหมู่การทดสอบ | รายละเอียดการทดสอบ | ผลลัพธ์ที่คาดหวัง | ความสำคัญ |
| :--- | :--- | :--- | :--- | :--- |
| **TC01** | Allocation Method | สร้างไฟล์แบบ Contiguous | บล็อกเรียงต่อกันเป็นช่วงเดียว | High |
| **TC02** | Allocation Method | สร้างไฟล์แบบ Linked | บล็อกกระจายตัวได้และเชื่อมโยงด้วยพอยน์เตอร์ | High |
| **TC03** | Allocation Method | สร้างไฟล์แบบ Indexed | จองพื้นที่ `size + 1` บล็อก (1 Index + Data) | High |
| **TC04** | Input Validation | ชื่อไฟล์ว่างเปล่า (Empty / Whitespace) | ปฏิเสธการสร้าง แจ้งเตือนชัดเจน | Medium |
| **TC05** | Input Validation | ชื่อไฟล์ยาวเกิน 30 ตัวอักษร | UI จำกัด 30 ตัวอักษร และ Core ปฏิเสธหากเกิน | Medium |
| **TC06** | Input Validation | ชื่อไฟล์ซ้ำ (Case-insensitive) | ปฏิเสธการสร้าง ป้องกันชื่อชนกัน | High |
| **TC07** | Input Validation | ขนาดไฟล์เป็น 0, ติดลบ, หรือทศนิยม | ปฏิเสธการสร้าง ต้องเป็นจำนวนเต็มบวก | High |
| **TC08** | Resource Limit | การจองจนดิสก์เต็ม (Full Disk - 64 บล็อก) | จองได้พอดี 64 บล็อก และปฏิเสธการจองเพิ่ม | High |
| **TC09** | Edge Case | ปรากฏการณ์ External Fragmentation | Contiguous ล้มเหลว แต่ Linked และ Indexed จองได้ | Critical |
| **TC10** | Boundary Test | จุดวิกฤติของ Indexed Allocation (63+1 vs 64+1) | ขนาด 63 จองได้ (รวม 64) ขนาด 64 ต้องถูกปฏิเสธ | High |
| **TC11** | Lifecycle | ลบไฟล์และการคืนสภาพบล็อก (Delete) | คืนบล็อกทั้ง Data และ Index เป็น Free ครบ 100% | Critical |
| **TC12** | Lifecycle | การรีเซ็ตระบบทั้งหมด (Reset Simulation) | ดิสก์กลับเป็น 64 Free Blocks สถานะสะอาด | Critical |

---

## 3. รายละเอียดขั้นตอนการทดสอบ (Step-by-Step Test Cases)

### TC01: การจัดสรรแบบต่อเนื่อง (Contiguous Allocation)
* **วัตถุประสงค์**: ทดสอบการจัดสรรบล็อกแบบเรียงติดต่อกันบนพื้นที่ว่าง
* **เงื่อนไขเริ่มต้น (Preconditions)**: ดิสก์ว่างทั้งหมด 64 บล็อก
* **ขั้นตอนการทดสอบ (Test Steps)**:
  1. ในช่อง **File name** พิมพ์ `alpha.bin`
  2. ในช่อง **Size (data blocks)** กรอก `6`
  3. ในกลุ่ม **Allocation method** คลิกเลือกการ์ด `Contiguous`
  4. กดปุ่ม **Create file**
* **ผลลัพธ์ที่คาดหวัง (Expected Results)**:
  - มีข้อความสถานะสีเขียว: `"Created “alpha.bin” successfully."`
  - Used Blocks เปลี่ยนเป็น `6`, Free Blocks เปลี่ยนเป็น `58`
  - บน Disk Grid: บล็อก ID `0` ถึง `5` กลายเป็นสีของไฟล์ `alpha.bin`
  - ในรายการ File Allocations การ์ดของ `alpha.bin` แสดง:
    - ข้อความรายละเอียด: `Start block 0 · Length 6`
    - Block chips เรียงตามลำดับ: `0` `1` `2` `3` `4` `5`
  - ตรวจสอบ Invariant: $6 + 58 = 64$

---

### TC02: การจัดสรรแบบเชื่อมโยง (Linked Allocation)
* **วัตถุประสงค์**: ทดสอบการจัดสรรบล็อกแบบไม่จำเป็นต้องติดกัน และมีการชี้ลำดับพอยน์เตอร์
* **เงื่อนไขเริ่มต้น**: ทำต่อจาก TC01 (มีบล็อกว่าง 58 บล็อก)
* **ขั้นตอนการทดสอบ**:
  1. กรอก **File name**: `beta.log`
  2. กรอก **Size**: `5`
  3. เลือก **Allocation method**: การ์ด `Linked`
  4. กดปุ่ม **Create file**
* **ผลลัพธ์ที่คาดหวัง**:
  - มีข้อความสถานะสีเขียว: `"Created “beta.log” successfully."`
  - Used Blocks เพิ่มขึ้น 5 (รวมเป็น `11`), Free Blocks ลดลงเป็น `53`
  - บน Disk Grid: มีบล็อก 5 ตำแหน่งเปลี่ยนเป็นสีของ `beta.log`
  - การ์ดของ `beta.log` แสดง:
    - ข้อความรายละเอียด: `Start block B1 · End block B5`
    - Block chips เป็นสายพอยน์เตอร์ที่สิ้นสุดด้วย chip `null`: `B1` → `B2` → `B3` → `B4` → `B5` → `null`
  - ตรวจสอบ Tooltip/Aria-label: บล็อกข้อมูลแสดงหมายเลข Next Block ที่ชี้ไป (ส่วนบล็อกสุดท้ายของสายโซ่จะไม่แสดง pointer ต่อตามการทำงานจริงของโค้ด)

---

### TC03: การจัดสรรแบบดัชนี (Indexed Allocation)
* **วัตถุประสงค์**: ทดสอบการใช้พื้นที่เพิ่มอีก 1 บล็อกสำหรับเป็น Index Block
* **เงื่อนไขเริ่มต้น**: ทำต่อจาก TC02 (มีบล็อกว่าง 53 บล็อก)
* **ขั้นตอนการทดสอบ**:
  1. กรอก **File name**: `gamma.dat`
  2. กรอก **Size**: `4` (ต้องการ 4 Data Blocks)
  3. เลือก **Allocation method**: การ์ด `Indexed`
  4. กดปุ่ม **Create file**
* **ผลลัพธ์ที่คาดหวัง**:
  - มีข้อความสถานะสีเขียว: `"Created “gamma.dat” successfully."`
  - Used Blocks เพิ่มขึ้น **5 บล็อก** (4 Data + 1 Index) เป็น `16`, Free Blocks เหลือ `48`
  - บน Disk Grid: ปรากฏ 1 บล็อกที่เป็น **Index Block** (มีสไตล์/ขอบ/สัญลักษณ์ Index ชัดเจน) และอีก 4 บล็อกเป็น **Data Blocks**
  - การ์ดของ `gamma.dat` แสดง:
    - ข้อมูลขนาด: `4 data blocks + 1 index block · 5 blocks on disk`
    - ข้อความรายละเอียด: `Index block <indexBlockId> points to 4 data blocks`
    - Block chips: chip ของ Index Block (สไตล์ Index) ตามด้วย `→` และ chip ของ Data Blocks: `<indexBlockId>` → `<b1>` `<b2>` `<b3>` `<b4>`

---

### TC04: การตรวจสอบชื่อไฟล์ว่างเปล่า (Empty & Whitespace Validation)
* **วัตถุประสงค์**: ทดสอบการป้องกันอินพุตชื่อไฟล์ที่ไม่ถูกต้อง
* **ขั้นตอนการทดสอบ**:
  1. ช่อง **File name**: เว้นว่างไว้ หรือพิมพ์เฉพาะช่องว่าง `"    "`
  2. ช่อง **Size**: กรอก `2`
  3. กดปุ่ม **Create file**
* **ผลลัพธ์ที่คาดหวัง**:
  - มีข้อความแจ้งเตือนสีแดง: `"Enter a file name."`
  - **Atomic Check**: สถานะดิสก์และจำนวน Used/Free Blocks ต้องไม่เปลี่ยนแปลง

---

### TC05: การตรวจสอบความยาวชื่อไฟล์ (Filename Length Limit)
* **วัตถุประสงค์**: ทดสอบการจำกัดความยาวชื่อไฟล์ไม่เกิน 30 ตัวอักษร ทั้งระดับ UI Input และ Core Simulation Validation
* **ขั้นตอนการทดสอบ**:
  - **วิธีที่ 1 (ทดสอบระดับ UI)**: 
    1. ในช่อง **File name**: พยายามพิมพ์หรือ Paste ข้อความที่มีความยาว 31 ตัวอักษรขึ้นไป เช่น `abcdefghijklmnopqrstuvwxyz12345`
    2. สังเกตตัวอักษรที่ปรากฏในช่อง
  - **วิธีที่ 2 (ทดสอบระดับ Core API ผ่าน Console)**: 
    1. กดปุ่ม `F12` เพื่อเปิด Developer Tools และไปที่แท็บ **Console**
    2. พิมพ์คำสั่ง: 
       ```javascript
       window.FileAlloc.app.simulation.createFile("a".repeat(31), 1, "contiguous")
       ```
    3. กด Enter เพื่อตรวจสอบผลลัพธ์
* **ผลลัพธ์ที่คาดหวัง**:
  - สำหรับวิธีที่ 1 (UI): ช่อง input จะป้องกันการพิมพ์เกิน 30 ตัวอักษร โดยตัดรับเฉพาะ 30 ตัวอักษรแรก (`maxlength="30"`)
  - สำหรับวิธีที่ 2 (Console): ระบบปฏิเสธและคืนค่า `{ success: false, message: "File name must be 30 characters or fewer." }`
  - สถานะดิสก์ไม่เปลี่ยนแปลงในทั้งสองกรณี

---

### TC06: การตรวจสอบชื่อไฟล์ซ้ำ (Case-Insensitive Duplicate Name)
* **วัตถุประสงค์**: ทดสอบการป้องกันชื่อไฟล์ซ้ำโดยไม่คำนึงถึงตัวพิมพ์เล็ก-ใหญ่
* **ขั้นตอนการทดสอบ**:
  1. สร้างไฟล์แรก: ชื่อ `report.pdf`, ขนาด `2`, แบบ Contiguous -> ผ่านสำเร็จ
  2. พยายามสร้างไฟล์ที่สอง: ชื่อ `REPORT.PDF` (ตัวพิมพ์ใหญ่ทั้งหมด), ขนาด `2`
  3. กดปุ่ม **Create file**
* **ผลลัพธ์ที่คาดหวัง**:
  - ระบบปฏิเสธพร้อมข้อความสีแดง: `“A file named “REPORT.PDF” already exists.”`
  - สถานะดิสก์ไม่เปลี่ยนแปลง

---

### TC07: การตรวจสอบขนาดไฟล์ผิดพลาด (Zero, Negative & Decimal Size)
* **วัตถุประสงค์**: ทดสอบว่าระบบปฏิเสธขนาดไฟล์ที่ไม่ใช่จำนวนเต็มบวก
* **ขั้นตอนการทดสอบ**:
  1. กรอกชื่อ `invalid1.txt`, ขนาด `0` -> กด Create file
  2. กรอกชื่อ `invalid2.txt`, ขนาด `-3` -> กด Create file
  3. กรอกชื่อ `invalid3.txt`, ขนาด `4.5` -> กด Create file
* **ผลลัพธ์ที่คาดหวัง**:
  - ทุกกรณีต้องแสดงข้อความเตือนสีแดง: `"File size must be a positive whole number."`
  - ไม่มีการตัดทอนหรือแปลงค่า และดิสก์ต้องไม่มีบล็อกถูกจัดสรรเพิ่ม

---

### TC08: การจัดสรรจนเต็มความจุดิสก์ (Full Disk Saturation)
* **วัตถุประสงค์**: ทดสอบพฤติกรรมเมื่อดิสก์ถูกใช้งานครบ 64 บล็อก
* **ขั้นตอนการทดสอบ**:
  1. กดปุ่ม **Reset simulation** เพื่อเริ่มจาก 0 บล็อก
  2. สร้างไฟล์ชื่อ `full.iso`, ขนาด `64`, แบบ `Contiguous Allocation`
  3. ตรวจสอบสถานะดิสก์
  4. พยายามสร้างไฟล์ใหม่: ชื่อ `extra.txt`, ขนาด `1` (ลองทั้ง Contiguous, Linked, และ Indexed)
* **ผลลัพธ์ที่คาดหวัง**:
  - ไฟล์ `full.iso` จองครบ 64 บล็อก (`Used Blocks: 64`, `Free Blocks: 0`)
  - เมื่อสั่งสร้าง `extra.txt`:
    - Contiguous/Linked: แจ้งเตือน `"Not enough free blocks. Required: 1; available: 0."`
    - Indexed: แจ้งเตือน `"Indexed allocation needs 2 blocks (1 data + 1 index); available: 0."`
  - ระบบคงสถานะ Used: 64, Free: 0 อย่างถูกต้อง

---

### TC09: การตรวจจับ External Fragmentation (กรณีสำคัญ)
* **วัตถุประสงค์**: พิสูจน์ว่า Contiguous ล้มเหลวเมื่อเกิด External Fragmentation ในขณะที่ Linked และ Indexed ทำงานได้
* **ขั้นตอนการทดสอบ**:
  1. กดปุ่ม **Reset simulation**
  2. สร้างไฟล์ขนาด 10 บล็อกแบบ Contiguous จำนวน 6 ไฟล์:
     - `f1` (ขนาด 10) -> ครอบครองบล็อก 0–9
     - `f2` (ขนาด 10) -> ครอบครองบล็อก 10–19
     - `f3` (ขนาด 10) -> ครอบครองบล็อก 20–29
     - `f4` (ขนาด 10) -> ครอบครองบล็อก 30–39
     - `f5` (ขนาด 10) -> ครอบครองบล็อก 40–49
     - `f6` (ขนาด 10) -> ครอบครองบล็อก 50–59
     *(เหลือบล็อก 60–63 ว่าง 4 บล็อก)*
  3. สั่ง **Delete** ไฟล์ `f2` และ `f4`
     *(ตอนนี้มีบล็อกว่าง: 10–19 (10 บล็อก), 30–39 (10 บล็อก), และ 60–63 (4 บล็อก) รวมบล็อกว่างทั้งสิ้น **24 บล็อก**)*
  4. ทดลองสร้างไฟล์ `f_large` ขนาด **15 บล็อก** แบบ `Contiguous Allocation`
  5. ทดลองเปลี่ยนไปเลือกการ์ด `Linked` ด้วยขนาด **15 บล็อก** เดิมแล้วกดสร้าง
  6. *(ทดสอบเพิ่มเติมสำหรับ Indexed)*: กด **Delete** ไฟล์ `f_large` ที่เพิ่งสร้าง จากนั้นทดลองสร้างไฟล์ชื่อ `f_indexed` ขนาด **15 บล็อก** แบบ `Indexed Allocation` (ต้องการพื้นที่ $15 + 1 = 16$ บล็อก ซึ่งพอดีกับบล็อกว่าง 24 บล็อก)
* **ผลลัพธ์ที่คาดหวัง**:
  - ในขั้นตอนที่ 4 (Contiguous): ระบบต้องล้มเหลวและแจ้งเตือน:
    `"There are 24 free blocks, but no 15-block consecutive run."`
    *(พิสูจน์ได้ว่าแม้พื้นที่จะพอ 24 > 15 แต่เกิด External Fragmentation จึงสร้างไม่ได้)*
  - ในขั้นตอนที่ 5 (Linked): ระบบสามารถสร้างไฟล์ `f_large` ได้สำเร็จทันที โดยใช้บล็อกว่างที่กระจายอยู่
    - ตรวจสอบ Invariant: Used Blocks กลายเป็น $40 + 15 = 55$, Free Blocks เหลือ $9$
  - ในขั้นตอนที่ 6 (Indexed): ระบบสามารถสร้างไฟล์ `f_indexed` ได้สำเร็จเช่นกัน โดยจัดสรร 1 Index Block และ 15 Data Blocks จากบล็อกว่างที่กระจายอยู่
    - ตรวจสอบ Invariant: Used Blocks กลายเป็น $40 + 16 = 56$, Free Blocks เหลือ $8$

---

### TC10: การทดสอบขอบเขตความจุของ Indexed Allocation
* **วัตถุประสงค์**: ทดสอบการคำนวณ `size + 1` บล็อกที่จุดขอบเขตสูงสุดของดิสก์
* **ขั้นตอนการทดสอบ**:
  1. กด **Reset simulation** (ดิสก์ว่าง 64 บล็อก)
  2. ทดสอบกรณีที่ 1: สร้างไฟล์ `max_indexed.dat`, ขนาด `63`, แบบ `Indexed Allocation`
  3. ลบไฟล์ `max_indexed.dat` ออก
  4. ทดสอบกรณีที่ 2: พยายามสร้างไฟล์ `overflow.dat`, ขนาด `64`, แบบ `Indexed Allocation`
* **ผลลัพธ์ที่คาดหวัง**:
  - กรณีที่ 1: สร้างสำเร็จ โดยใช้ 63 Data Blocks + 1 Index Block = รวม **64 บล็อกเต็มดิสก์**
  - กรณีที่ 2: ระบบต้องปฏิเสธทันที และแจ้งเตือน:
    `"Indexed allocation needs 65 blocks (64 data + 1 index); available: 64."`

---

### TC11: การลบไฟล์และการคืนพื้นที่ (File Deletion & Space Reclamation)
* **วัตถุประสงค์**: ยืนยันว่าการลบไฟล์คืนบล็อกทั้งหมด (ทั้ง Data และ Index) และล้างพอยน์เตอร์เกลี้ยง
* **ขั้นตอนการทดสอบ**:
  1. สร้างไฟล์ `index_test.dat` ขนาด 5 แบบ `Indexed Allocation` (ใช้ 6 บล็อก)
  2. จดบันทึกหมายเลขบล็อกที่เป็น Index Block และ Data Blocks จากการ์ดรายละเอียดไฟล์ (เช่น บล็อก $B_{index}$ และ $B_{data}$)
  3. กดปุ่ม **Delete** ที่การ์ดของไฟล์ `index_test.dat`
  4. ตรวจสอบบล็อกเหล่านั้นบน Disk Grid
  5. เปิด Browser Console (F12) เพื่อตรวจสอบสถานะเชิงลึกของบล็อกที่ถูกคืน:
     ```javascript
     // แทนที่ BLOCK_ID ด้วยหมายเลข Index Block หรือ Data Block ที่จดบันทึกไว้ในขั้นตอนที่ 2
     window.FileAlloc.app.simulation.getState().disk.blocks[BLOCK_ID]
     ```
* **ผลลัพธ์ที่คาดหวัง**:
  - แสดงข้อความสีเขียวบน UI: `"Deleted “index_test.dat” and released its blocks."`
  - Used Blocks กลับเป็น `0`, Free Blocks กลับเป็น `64`
  - ทุกบล็อกที่เคยเป็นของไฟล์นี้กลับมามีคลาสสถานะเป็น Free บนหน้าเว็บ
  - ตรวจสอบใน Console: บล็อกตามหมายเลข `BLOCK_ID` ที่เคยเป็นของไฟล์นี้ จะต้องถูกรีเซ็ตค่ากลับเป็น:
    ```javascript
    {
      id: BLOCK_ID,
      status: "free",
      fileId: null,
      role: null,
      nextBlockId: null
    }
    ```
    (ยืนยันว่า `fileId`, `role` และ `nextBlockId` ถูกเคลียร์กลับเป็น `null` ทั้งหมดอย่างแท้จริง ไม่หลงเหลือข้อมูลเดิม)

---

### TC12: การรีเซ็ตระบบจำลอง (Simulation Reset)
* **วัตถุประสงค์**: ทดสอบการกลับคืนสู่สถานะเริ่มต้นของการจำลองทั้งหมด
* **ขั้นตอนการทดสอบ**:
  1. สร้างไฟล์หลายๆ แบบ (Contiguous, Linked, Indexed) จนดิสก์มีข้อมูลบางส่วน
  2. คลิกการ์ดไฟล์หนึ่งไฟล์เพื่อ Highlight บล็อกของไฟล์นั้น
  3. กดปุ่ม **Reset simulation** ที่มุมขวาบน
  4. กด **OK** บนกล่องข้อความยืนยัน (`confirm dialog`)
* **ผลลัพธ์ที่คาดหวัง**:
  - มีข้อความสีเขียว: `"Simulation reset. All blocks are free."`
  - Total Blocks: 64, Used Blocks: 0, Free Blocks: 64
  - Disk Grid ทั้ง 64 ช่องกลับเป็นช่องสีว่าง (Free) ไม่มีสีของไฟล์ค้างอยู่
  - รายการ File Allocations กลับสู่สถานะ Empty State: `"No files allocated."`
  - ตัวนับ ID ไฟล์ถูกรีเซ็ตกลับเป็นเริ่มต้น

---

## 4. ตารางตรวจสอบ Invariant (System Invariants Checklist)

ผู้ทดสอบสามารถใช้เช็กลิสต์นี้ตรวจสอบระบบหลังจากดำเนินการใดๆ:

| ข้อกำหนด Invariant | เงื่อนไขที่ต้องเป็นจริง | วิธีตรวจสอบ |
| :--- | :--- | :--- |
| **Sum of Blocks** | $\text{Used} + \text{Free} = 64$ เสมอ | สังเกตตัวเลขบน Summary Cards รวมกันต้องได้ 64 ทุกครั้ง |
| **Free Block Cleanliness** | บล็อก Free ต้องไม่มีข้อมูลหลงเหลือ | ตรวจสอบว่าไม่มี Label ชื่อไฟล์ หรือพอยน์เตอร์ชี้ไปบล็อกอื่น |
| **Atomic Operation** | Error ต้องไม่ทำให้ดิสก์เปลี่ยน | เมื่อสร้างไม่สำเร็จ ตรวจสอบว่า Used Blocks ต้องเท่าเดิม 100% |
| **Index Overhead** | Indexed ใช้มากกว่าขนาดไฟล์ 1 เสมอ | ตรวจสอบว่า Used Blocks เพิ่มขึ้นเท่ากับ `size + 1` |
| **Chain Validity** | ห่วงโซ่ Linked สิ้นสุดด้วย null | Block chips ของไฟล์ Linked ต้องจบด้วย chip `null` และไม่มี Loop บนดิสก์ |

---

## 5. รูปแบบการรายงานบั๊ก (Bug Report Template)

หากพบว่าผลการทดสอบไม่ตรงกับผลลัพธ์ที่คาดหวัง ให้บันทึกข้อมูลและส่งให้ **โอห์ม (Core)** หรือ **อาร์ต (UI)** ตามแบบฟอร์มนี้:

```text
[BUG REPORT]
1. ลำดับขั้นตอนก่อนเกิดปัญหา: (เช่น สร้างไฟล์ A แบบ Indexed แล้วสั่งลบ...)
2. ค่าอินพุตที่ใช้: (File Name, Size, Allocation Type)
3. ผลลัพธ์ที่ควรจะได้ (Expected Result):
4. ผลลัพธ์ที่เกิดขึ้นจริง (Actual Result):
5. ข้อมูล Console Error หรือภาพถ่ายหน้าจอ:
```
