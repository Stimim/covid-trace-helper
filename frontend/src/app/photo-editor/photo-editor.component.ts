import { Component, OnInit, Input } from '@angular/core';

import { Photo } from '../process-page/process-page.component';
import { ImageService } from '../image.service';
import { environment } from '../../environments/environment';


class TextAnnotation {
  desc: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;

  constructor([desc, minX, maxX, minY, maxY]: [string, number, number, number, number]) {
    this.desc = desc;
    this.minX = minX
    this.maxX = maxX
    this.minY = minY
    this.maxY = maxY
  }

  ShouldMerge(other: TextAnnotation) {
    let has_overlap = this.minY <= other.minY && other.minY <= this.maxY;
    has_overlap ||= other.minY <= this.minY && this.minY <= other.maxY;

    if (!has_overlap)
      return false;
    if (this.maxX > other.minX)
      // My right boundary is in the right of the left boundary of other
      return false;
    if (this.maxX + 8 < other.minX)
      // The gap between to boxes is too large
      return false;
    return true;
  }

  Merge(other: TextAnnotation) {
    this.desc += other.desc;
    this.minX = Math.min(this.minX, other.minX);
    this.maxX = Math.max(this.maxX, other.maxX);
    this.minY = Math.min(this.minY, other.minY);
    this.maxY = Math.max(this.maxY, other.maxY);
  }
};

class Row {
  texts: TextAnnotation[];
  minY: number;
  maxY: number;

  constructor(text: TextAnnotation) {
    this.texts = [ text ];
    this.minY = text.minY;
    this.maxY = text.maxY;
  }

  ShouldMerge(text: TextAnnotation) {
    let has_overlap = this.minY <= text.minY && text.minY <= this.maxY;
    has_overlap ||= text.minY <= this.minY && this.minY <= text.maxY;

    if (!has_overlap)
      return false;

    return true;
  }

  Merge(text: TextAnnotation) {
    this.texts.push(text);
    this.minY = Math.min(this.minY, text.minY);
    this.maxY = Math.max(this.maxY, text.maxY);
  }
};


@Component({
  selector: 'app-photo-editor',
  templateUrl: './photo-editor.component.html',
  styleUrls: ['./photo-editor.component.css']
})
export class PhotoEditorComponent implements OnInit {

  @Input() photo!: Photo;

  error?: any;

  rows: Row[] = [];

  outerBoxWidth = 0;
  outerBoxHeight = 0;

  constructor(private imageService: ImageService) { }

  ngOnInit(): void {
    if (this.photo === undefined) {
      this.error = 'No photo, something went wrong...';
      return;
    }
    //let response:any = { "results": [ [ "臺北市", 92, 177, 21, 53 ], [ "確診", 204, 226, 25, 47 ], [ "個案", 231, 280, 25, 47 ], [ "公共", 282, 336, 21, 53 ], [ "場", 338, 369, 21, 53 ], [ "域", 371, 397, 21, 53 ], [ "活動", 399, 446, 21, 53 ], [ "史", 446, 468, 25, 47 ], [ "案", 243, 264, 58, 81 ], [ "28420", 275, 324, 61, 78 ], [ "日期", 88, 124, 100, 119 ], [ "時間", 196, 233, 99, 118 ], [ "地點", 371, 410, 101, 119 ], [ "享", 322, 336, 131, 145 ], [ "鴨", 339, 353, 131, 145 ], [ "台北", 361, 392, 131, 145 ], [ "忠孝", 395, 426, 131, 145 ], [ "東", 428, 440, 128, 147 ], [ "店", 446, 460, 131, 145 ], [ "大安", 316, 347, 152, 166 ], [ "區", 350, 364, 152, 166 ], [ "忠孝", 367, 398, 152, 166 ], [ "東路", 401, 432, 152, 166 ], [ "四段", 436, 467, 152, 166 ], [ "111/4/7", 58, 120, 136, 156 ], [ "(", 123, 126, 140, 154 ], [ "四", 128, 140, 137, 156 ], [ ")", 142, 153, 138, 157 ], [ "18", 168, 190, 138, 157 ], [ ":", 192, 193, 138, 157 ], [ "38-20", 195, 233, 138, 159 ], [ ":", 235, 240, 139, 158 ], [ "00", 242, 258, 142, 154 ], [ "銀", 358, 372, 178, 192 ], [ "角", 375, 389, 178, 192 ], [ "酒", 392, 406, 178, 192 ], [ "場", 409, 423, 178, 192 ], [ "中", 334, 346, 199, 213 ], [ "山區", 351, 381, 199, 213 ], [ "林森", 384, 415, 198, 213 ], [ "北路", 418, 449, 198, 214 ], [ "21:51-23:00", 173, 258, 188, 199 ], [ "111/4/8", 64, 113, 211, 225 ], [ "(", 114, 126, 211, 226 ], [ "五", 128, 141, 210, 224 ], [ ")", 143, 146, 212, 227 ], [ "香", 358, 372, 227, 241 ], [ "緹", 375, 389, 227, 241 ], [ "餐廳", 392, 423, 227, 241 ], [ "23:11-02:00", 173, 258, 236, 247 ], [ "中", 317, 329, 248, 262 ], [ "山區", 334, 364, 248, 262 ], [ "中山", 368, 397, 248, 262 ], [ "北路", 399, 433, 245, 264 ], [ "一段", 435, 464, 245, 264 ], [ "00:30-02:00", 172, 257, 282, 299 ], [ "THE", 279, 310, 276, 290 ], [ "DOOR", 318, 368, 275, 291 ], [ "SHISHA", 374, 436, 274, 291 ], [ "HOUSE", 445, 501, 274, 291 ], [ "大安", 316, 347, 297, 311 ], [ "區", 350, 364, 297, 311 ], [ "敦化", 367, 398, 297, 311 ], [ "南路", 401, 432, 297, 311 ], [ "一段", 435, 466, 297, 311 ], [ "111/4/10", 57, 124, 307, 325 ], [ "(", 128, 131, 310, 324 ], [ "日", 133, 143, 307, 325 ], [ ")", 148, 151, 311, 324 ], [ "ス", 288, 300, 327, 337 ], [ "シ", 305, 316, 326, 338 ], [ "ロ", 324, 333, 328, 337 ], [ "ー", 335, 351, 322, 341 ], [ "壽司", 353, 386, 322, 341 ], [ "郎", 390, 403, 325, 339 ], [ "台北", 413, 444, 325, 339 ], [ "中華", 446, 484, 322, 341 ], [ "店", 486, 495, 322, 341 ], [ "中正", 325, 355, 346, 360 ], [ "區", 358, 372, 346, 359 ], [ "中華", 376, 406, 346, 360 ], [ "路", 410, 423, 346, 360 ], [ "一段", 426, 457, 346, 360 ], [ "11:27-12:30", 173, 258, 333, 345 ], [ "提醒", 38, 59, 601, 610 ], [ "曾", 61, 69, 600, 610 ], [ "出入", 72, 91, 601, 610 ], [ "相關", 94, 113, 601, 610 ], [ "場所", 116, 135, 600, 610 ], [ "民眾", 137, 158, 598, 612 ], [ "請", 160, 170, 598, 612 ], [ "推行", 170, 189, 601, 610 ], [ "自我", 192, 211, 600, 610 ], [ "健康", 213, 231, 600, 610 ], [ "監測", 233, 253, 601, 610 ], [ ",", 258, 259, 605, 608 ], [ "若", 265, 275, 601, 610 ], [ "出現", 277, 295, 601, 610 ], [ "發燒", 298, 318, 600, 610 ], [ "、", 322, 324, 605, 606 ], [ "上", 329, 339, 601, 610 ], [ "呼吸道", 341, 371, 601, 610 ], [ "、", 376, 378, 605, 606 ], [ "腹", 383, 391, 601, 610 ], [ "腐", 393, 400, 598, 612 ], [ "、", 408, 410, 605, 606 ], [ "嗅", 415, 423, 601, 610 ], [ "味", 425, 435, 598, 612 ], [ "理", 437, 448, 598, 612 ], [ "要", 450, 458, 598, 612 ], [ "常", 458, 466, 600, 610 ], [ "等", 468, 480, 598, 612 ], [ "症狀", 490, 498, 601, 610 ], [ "塵", 501, 509, 600, 610 ], [ "佩", 511, 520, 598, 612 ], [ "識", 522, 528, 598, 612 ], [ "醫用", 39, 58, 614, 623 ], [ "口", 62, 69, 615, 623 ], [ "罢", 72, 80, 614, 623 ], [ ",", 86, 87, 618, 621 ], [ "速", 89, 106, 611, 625 ], [ "至", 108, 114, 611, 625 ], [ "就近", 116, 139, 611, 625 ], [ "指定", 141, 159, 611, 625 ], [ "社區", 161, 181, 611, 625 ], [ "採", 183, 191, 611, 625 ], [ "檢", 193, 204, 611, 625 ], [ "院所", 206, 221, 611, 625 ], [ "就醫", 223, 249, 611, 625 ], [ ",", 251, 251, 611, 625 ], [ "不得", 255, 274, 614, 623 ], [ "搭乘", 277, 295, 613, 623 ], [ "大眾", 297, 319, 611, 625 ], [ "運輸", 321, 341, 611, 625 ], [ "。", 344, 346, 617, 619 ], [ "就醫", 39, 58, 627, 636 ], [ "時", 60, 71, 624, 638 ], [ "請", 73, 84, 624, 638 ], [ "主動", 83, 102, 626, 636 ], [ "告知", 104, 124, 624, 638 ], [ "接觸", 127, 146, 626, 636 ], [ "史", 149, 157, 627, 636 ], [ "、", 162, 164, 631, 632 ], [ "旅遊", 166, 191, 624, 638 ], [ "史", 193, 201, 624, 638 ], [ "、", 203, 206, 624, 638 ], [ "職業", 213, 231, 626, 636 ], [ "是", 234, 242, 627, 636 ], [ "露", 245, 253, 627, 636 ], [ "、", 258, 260, 631, 632 ], [ "周", 266, 274, 627, 636 ], [ "這", 276, 289, 624, 638 ], [ "其他", 298, 306, 627, 636 ], [ "人", 308, 319, 624, 638 ], [ "是否", 321, 341, 624, 638 ], [ "有", 343, 351, 624, 638 ], [ "類似", 362, 370, 627, 636 ], [ "症狀", 373, 391, 627, 636 ], [ "等", 393, 401, 624, 638 ], [ "。", 409, 410, 630, 632 ], [ "依", 35, 50, 637, 653 ], [ "傳染病", 52, 81, 637, 653 ], [ "防治", 83, 107, 637, 653 ], [ "法", 109, 115, 637, 653 ], [ "第", 117, 126, 637, 653 ], [ "43", 128, 141, 637, 653 ], [ "條", 143, 155, 637, 653 ], [ "傳染病", 157, 186, 637, 653 ], [ "或", 188, 200, 637, 653 ], [ "疑似", 202, 220, 637, 653 ], [ "染病", 222, 251, 637, 653 ], [ "病人", 253, 271, 637, 653 ], [ "及", 273, 285, 637, 653 ], [ "相", 287, 294, 637, 653 ], [ "围", 296, 305, 637, 653 ], [ "人員", 307, 325, 637, 653 ], [ "對於", 327, 345, 637, 653 ], [ "地方", 347, 367, 637, 653 ], [ "主管", 369, 393, 637, 653 ], [ "機關", 395, 413, 637, 653 ], [ "調查", 415, 432, 637, 653 ], [ "傳染病", 434, 466, 637, 653 ], [ "來源", 468, 486, 637, 653 ], [ "或", 488, 498, 637, 653 ], [ "採", 500, 509, 637, 653 ], [ "行", 511, 517, 637, 653 ], [ "其", 519, 526, 637, 653 ], [ "他", 39, 47, 653, 662 ], [ "必要", 50, 70, 653, 662 ], [ "之", 72, 81, 650, 664 ], [ "措施", 94, 102, 652, 662 ], [ "之", 104, 114, 650, 664 ], [ "检驗", 116, 135, 653, 662 ], [ "診斷", 138, 157, 652, 664 ], [ "、", 162, 164, 657, 658 ], [ "調查", 166, 194, 650, 664 ], [ "及", 196, 201, 650, 664 ], [ "處", 202, 211, 652, 662 ], [ "罢", 213, 221, 650, 664 ], [ ",", 226, 227, 657, 660 ], [ "不得", 234, 253, 653, 662 ], [ "拒绝", 255, 274, 653, 662 ], [ "、", 280, 282, 657, 658 ], [ "規", 286, 295, 653, 662 ], [ "理", 298, 306, 653, 662 ], [ "或", 308, 319, 650, 664 ], [ "妨礙", 321, 341, 650, 664 ], [ ",", 343, 346, 650, 664 ], [ "違反", 348, 371, 650, 664 ], [ "者", 373, 382, 652, 662 ], [ ",", 386, 387, 657, 660 ], [ "依", 389, 401, 650, 664 ], [ "同", 405, 413, 653, 662 ], [ "法", 415, 424, 650, 664 ], [ "第", 426, 435, 652, 662 ], [ "67", 437, 449, 650, 664 ], [ "條", 454, 463, 652, 662 ], [ "虛", 465, 474, 652, 662 ], [ "新", 476, 484, 652, 662 ], [ "查", 486, 494, 650, 664 ], [ "幣", 496, 509, 650, 664 ], [ "六", 508, 517, 653, 662 ], [ "華", 519, 527, 653, 662 ], [ "元", 38, 48, 665, 674 ], [ "以上", 50, 70, 665, 675 ], [ "三十", 72, 92, 663, 676 ], [ "萬元", 83, 114, 663, 675 ], [ "以下", 116, 135, 662, 675 ], [ "割", 138, 146, 662, 674 ], [ "錢", 149, 158, 662, 674 ], [ "。", 162, 164, 668, 670 ], [ "以", 39, 48, 678, 687 ], [ "當事人", 50, 80, 678, 687 ], [ "腺", 83, 91, 678, 687 ], [ "述", 93, 103, 678, 687 ], [ "為主", 105, 124, 677, 688 ], [ ",", 130, 131, 682, 686 ], [ "如有", 133, 160, 676, 689 ], [ "更新", 162, 181, 675, 689 ], [ "資料", 181, 199, 676, 687 ], [ "再", 202, 210, 677, 687 ], [ "另行", 213, 231, 677, 687 ], [ "公布", 233, 253, 675, 688 ], [ "。", 255, 260, 675, 688 ], [ "臺北市", 276, 319, 691, 704 ], [ "政府", 322, 350, 691, 704 ], [ "TAIPEI", 235, 269, 706, 715 ], [ "Tipei", 276, 294, 706, 713 ], [ "City", 297, 309, 706, 713 ], [ "Government", 311, 350, 706, 712 ], [ "詳細", 91, 114, 720, 730 ], [ "防疫", 117, 141, 720, 730 ], [ "資訊", 143, 166, 720, 730 ], [ "請", 169, 179, 720, 730 ], [ "上", 181, 190, 717, 733 ], [ "臺北市", 194, 231, 719, 730 ], [ "政府", 234, 258, 720, 730 ], [ "嚴重", 260, 284, 719, 730 ], [ "特殊", 286, 310, 720, 730 ], [ "傅", 313, 323, 720, 730 ], [ "染", 326, 337, 720, 730 ], [ "性", 340, 351, 720, 730 ], [ "肺炎", 353, 377, 719, 730 ], [ "(", 379, 382, 720, 731 ], [ "COVID", 384, 424, 720, 729 ], [ "-", 427, 430, 726, 726 ], [ "19", 432, 445, 717, 733 ], [ ")", 447, 450, 717, 733 ], [ "專區", 454, 479, 720, 730 ], [ "2022/4/12", 492, 557, 737, 749 ] ] };
    //this._ProcessResponse(response);
    this.imageService.QueryTextDetectionResult(this.photo.checksum).subscribe(
      (response: any) => {
        if (response.results) {
          this._ProcessResponse(response);
        } else if (response.error) {
          this.error = response.error;
        } else {
          this.error = 'No result, something went wrong...';
        }
      },
      (error: any) => {
        this.error = error.error;
      }
    );
  }

  _ProcessResponse(response: any) {
    let textAnnotations: TextAnnotation[] = [];
    if (response.results) {
      // first phase, merge blocks that are on the same row, and close enough
      let cur = 0;
      for (let xs of response.results) {
        let x = new TextAnnotation(xs);
        this.outerBoxWidth = Math.max(x.maxX, this.outerBoxHeight);
        this.outerBoxHeight = Math.max(x.maxY, this.outerBoxHeight);

        if (textAnnotations.length === 0) {
          textAnnotations.push(x);
          continue;
        }
        if (textAnnotations[cur].ShouldMerge(x)) {
          textAnnotations[cur].Merge(x);
        } else {
          textAnnotations.push(x);
          cur++;
        }
      }
      // second phase, let's split into multiple rows.
      let results: Row[] = [];
      cur = 0;
      for (let text of textAnnotations) {
        results.push(new Row(text));
        //if (results.length === 0) {
          //results.push(new Row(text));
          //continue;
        //}

        //if (results[cur].ShouldMerge(text)) {
          //results[cur].Merge(text);
        //} else {
          //results.push(new Row(text));
          //cur++;
        //}
      }
      this.rows = results;
      console.log(this.rows);
    } else if (response.error) {
      this.error = response.error;
    } else {
      this.error = 'No result, something went wrong...';
    }
  }

  GetURL(photo: Photo) {
    return `https://storage.cloud.google.com/${environment.storageBucketId}/${environment.storageRootFolder}/${photo.checksum}`;
  }

  ComputeBoxStyle(row: Row) {
    let top = row.texts[0].minY;
    let left = row.texts[0].minX;
    if (this.outerBoxHeight > 1000) {
      top *= 1000 / this.outerBoxHeight;
      left *= 1000 / this.outerBoxHeight;
    }
    return {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
    };
  }

  ComputeOuterBouxStyle() {
    let height = this.outerBoxHeight;
    let width = this.outerBoxWidth;

    if (this.outerBoxHeight > 1000) {
      height *= 1000 / this.outerBoxHeight;
      width *= 1000 / this.outerBoxHeight;
    }
    return {
      width: `${width}px`,
      height: `${height}px`,
    }
  }
}
