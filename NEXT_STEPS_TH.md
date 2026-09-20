# คู่มือทำงานต่อสำหรับอาร์ตและโชกุน

ไฟล์นี้สรุปแบบง่ายว่าโปรเจกต์อยู่ตรงไหนแล้ว และแต่ละคนต้องทำอะไรต่อค่ะ

## ตอนนี้ระบบทำอะไรได้แล้ว

โอห์มทำระบบหลักไว้แล้ว ได้แก่

- จำลอง Disk จำนวน 64 blocks
- สร้างไฟล์แบบ Contiguous Allocation
- สร้างไฟล์แบบ Linked Allocation
- สร้างไฟล์แบบ Indexed Allocation
- ลบไฟล์และคืน block
- Reset ระบบ
- แสดงจำนวน Used / Free Blocks
- แสดง block ที่แต่ละไฟล์ใช้งาน
- กดเลือกไฟล์เพื่อ highlight block ของไฟล์นั้น
- ตรวจ input ผิด เช่น ชื่อซ้ำ ขนาดติดลบ หรือพื้นที่ไม่พอ

ไม่ต้องเขียน allocation algorithm ใหม่ ให้ทำงานต่อจากของเดิมได้เลย

## วิธีเริ่มทำงาน

1. Clone repository จาก GitHub

   ```bash
   git clone https://github.com/sirapatw-sys/OSProject_FileAlloc.git
   ```

2. เข้าโฟลเดอร์โปรเจกต์

   ```bash
   cd OSProject_FileAlloc
   ```

3. ดึงโค้ดล่าสุดจาก branch `main`

   ```bash
   git pull origin main
   ```

4. สร้าง branch ของตัวเองก่อนแก้ไฟล์

5. เปิด `index.html` ด้วย browser เพื่อลองระบบ

โปรเจกต์นี้ไม่ต้องติดตั้ง package และไม่มี backend

---

## งานของอาร์ต: UI และ Visualization

### สร้าง branch

```bash
git switch -c feature/ui-visualization
```

### งานที่ต้องทำ

- ปรับหน้าตาเว็บให้อ่านง่ายและดูเรียบร้อย
- ปรับส่วน Create File ให้ใช้งานง่าย
- ปรับตาราง Disk Blocks ให้เห็นสถานะชัดเจน
- ทำสี Free Block และ Used Block ให้ต่างกัน
- ให้แต่ละไฟล์มีสีแยกจากกัน
- ทำ Index Block ให้ดูต่างจาก Data Block
- ปรับกล่อง Total / Used / Free Blocks
- ปรับรายการ File Allocations
- ตรวจว่า highlight block ทำงานชัดเจน
- ปรับหน้าเว็บให้แสดงบน laptop และมือถือได้เหมาะสม

### ไฟล์หลักที่อาร์ตแก้ได้

```text
css/styles.css
js/ui.js
index.html
```

`index.html` ให้แก้เฉพาะ layout หรือข้อความบนหน้าเว็บ ถ้าจะเปลี่ยน `id` ของ element ต้องแก้จุดที่เรียกใช้ใน `js/ui.js` ด้วย

### สิ่งที่อาร์ตไม่ควรแก้เอง

- Allocation algorithms ใน `js/allocators.js`
- Data model ใน `js/models.js`
- Create, Delete และ Reset logic ใน `js/simulation.js`
- จำนวน Disk Blocks
- กติกาว่า Indexed ต้องใช้เพิ่มอีก 1 index block

ถ้าต้องการข้อมูลเพิ่มจากระบบเพื่อแสดงบนหน้าจอ ให้บอกโอห์มก่อน ไม่ควรแก้ state โดยตรงค่ะ

### ก่อนส่งงานของอาร์ต

- [ ] สร้างไฟล์ได้ครบทั้ง 3 วิธี
- [ ] ปุ่ม Delete ยังทำงาน
- [ ] ปุ่ม Reset ยังทำงาน
- [ ] Used / Free แสดงถูกต้อง
- [ ] ชื่อไฟล์ยาวแล้ว layout ไม่แตก
- [ ] หน้าจอ laptop แสดงครบ
- [ ] ไม่มี error สีแดงใน browser console
- [ ] แนบภาพหน้าจอใน Pull Request

เมื่อเสร็จแล้ว push branch:

```bash
git add index.html css/styles.css js/ui.js
git commit -m "feat: improve allocation visualization UI"
git push -u origin feature/ui-visualization
```

จากนั้นเปิด Pull Request เข้า `main` และรอโอห์มตรวจค่ะ

---

## งานของโชกุน: Testing, เอกสาร และเตรียมเดโม

### สร้าง branch

```bash
git switch -c docs/testing-and-demo
```

### งานที่ต้องทำ

- เขียน test cases เป็นขั้นตอนที่คนอื่นลองตามได้
- ทดลองสร้างไฟล์ครบทั้ง 3 allocation methods
- ทดสอบชื่อไฟล์ซ้ำ
- ทดสอบขนาดเป็น 0, ติดลบ และทศนิยม
- ทดสอบกรณี Disk เต็ม
- ทดสอบ Contiguous Allocation ที่พื้นที่รวมพอ แต่ไม่มีช่องว่างติดกัน
- ทดสอบว่า Indexed ใช้ `ขนาดไฟล์ + 1` block
- ทดสอบ Delete แล้ว block กลับมาเป็น Free ครบ
- ทดสอบ Reset แล้ว Disk กลับมา Free 64 blocks
- ปรับ README ให้อธิบายโปรเจกต์และวิธีใช้งานชัดเจน
- เขียน demo script สำหรับใช้ตอนนำเสนอ

### ไฟล์ที่โชกุนควรสร้าง

```text
docs/requirements.md
docs/test-cases.md
docs/demo-script.md
```

โชกุนแก้ `README.md` เพิ่มได้ แต่ไม่ควรแก้ allocation logic เอง ถ้าพบบั๊กให้จดข้อมูลต่อไปนี้แล้วแจ้งโอห์ม:

1. ทำอะไรไปบ้างก่อนเกิดบั๊ก
2. ค่าที่กรอก
3. ผลที่ควรได้
4. ผลที่เกิดจริง
5. ภาพหน้าจอหรือข้อความ error ถ้ามี

### ก่อนส่งงานของโชกุน

- [ ] มี test case ของทั้ง 3 allocation methods
- [ ] มีกรณีทดสอบ input ผิด
- [ ] มีกรณีพื้นที่ไม่พอ
- [ ] ตรวจว่า Used + Free = 64 ทุกครั้ง
- [ ] มีขั้นตอนเดโมที่ทำตามได้ภายใน 5–7 นาที
- [ ] README บอกวิธีเปิดโปรเจกต์
- [ ] เอกสารใช้ภาษาที่อ่านง่าย

เมื่อเสร็จแล้ว push branch:

```bash
git add README.md docs/
git commit -m "docs: add test cases and demo guide"
git push -u origin docs/testing-and-demo
```

จากนั้นเปิด Pull Request เข้า `main` และรอโอห์มตรวจค่ะ

---

## กติกาที่ทุกคนต้องเข้าใจตรงกัน

- File size หมายถึงจำนวน Data Blocks
- Contiguous ต้องใช้ block ที่ติดกันทั้งหมด
- Linked ใช้ block ที่ไม่ติดกันได้ และเรียงเป็น chain
- Indexed ใช้ Data Blocks ตามขนาดไฟล์ และเพิ่ม Index Block อีก 1 block
- ชื่อไฟล์ห้ามซ้ำ โดยตัวพิมพ์เล็กและพิมพ์ใหญ่ถือว่าเป็นชื่อเดียวกัน
- ถ้าสร้างไฟล์ไม่สำเร็จ สถานะ Disk ต้องไม่เปลี่ยน
- ทุกเวลา `Used Blocks + Free Blocks` ต้องเท่ากับ 64
- Refresh หน้าเว็บแล้วข้อมูลจะเริ่มใหม่ เพราะโปรเจกต์นี้ไม่เก็บข้อมูลถาวร

## ก่อนเริ่มงานทุกครั้ง

ถ้าเพิ่งสร้าง branch ใหม่ ให้สร้างจาก `main` ล่าสุด:

```bash
git switch main
git pull origin main
git switch -c ชื่อ-branch
```

ถ้าทำ branch ไว้แล้ว ให้ดึงการเปลี่ยนแปลงล่าสุดของทีมก่อนทำงานต่อ และอย่าแก้บน `main` โดยตรง

## เมื่อมีปัญหา

- ปัญหา allocation หรือ state ของ Disk: แจ้งโอห์ม
- ปัญหาหน้าตา สี หรือ layout: แจ้งอาร์ต
- ปัญหา test case เอกสาร หรือลำดับเดโม: แจ้งโชกุน

อย่าเพิ่ม feature ใหม่ เช่น backend, login, upload file, folder system หรือ defragmentation เพราะอยู่นอก scope ของโปรเจกต์ 20 วันค่ะ
