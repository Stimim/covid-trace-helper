import { Component, OnInit, Input, ElementRef, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import { Photo, ImageService, ImageProcessState } from '../image.service';
import { environment } from '../../environments/environment';
import { TextAnnotation, ProcessTextAnnotation, IsOverlapping } from '../utils/text-annotation';


class Point {
  x: number;
  y: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
};


@Component({
  selector: 'app-photo-editor',
  templateUrl: './photo-editor.component.html',
  styleUrls: ['./photo-editor.component.css']
})
export class PhotoEditorComponent implements OnInit {

  @ViewChild('img') imgRef?: ElementRef;
  @ViewChild('canvas') canvasRef!: ElementRef;

  @Input() photo!: Photo;
  @Input() formGroup!: FormGroup;

  error?: any;

  texts: TextAnnotation[] = [];

  outerBoxWidth = 0;
  outerBoxHeight = 0;
  boundaryList: TextAnnotation[] = [];
  processTextAnnotationDone = false;

  selectedAreaStartPoint?: Point;
  selectedAreaEndPoint?: Point;

  constructor(private imageService: ImageService) { }

  ngOnInit(): void {
    if (this.photo === undefined) {
      this.error = 'No photo, something went wrong...';
      return;
    }
    this.formGroup?.valueChanges.subscribe(() => {
      this.DrawCanvas();
    });
    this.imageService.QueryTextDetectionResult(this.photo.checksum).subscribe(
      (response: any) => {
        this._ProcessResponse(response);
      },
      (error: any) => {
        this.error = error.error;
      }
    );
  }

  ngAfterViewInit(): void {
    // this._ProcessImage();
  }

  async _ProcessResponse(response: any) {
    if (!response.results) {
      if (response.error) {
        this.error = response.error;
      } else {
        this.error = 'No result, something went wrong...';
      }
      return;
    }

    const textAnnotations: TextAnnotation[] = [];
    for (let xs of response.results) {
      textAnnotations.push(new TextAnnotation(xs));
    }
    while (this.imgRef === undefined)
      await new Promise(r => setTimeout(r, 1000));
    while (!this.imgRef.nativeElement.complete)
      await new Promise(r => setTimeout(r, 1000));

    const [results, boundaryList, width, height] = await ProcessTextAnnotation(this.imgRef, textAnnotations);
    this.processTextAnnotationDone = true;

    this.texts = results;
    this.outerBoxWidth = width;
    this.outerBoxHeight = height;
    this.boundaryList = boundaryList;

    this.DrawCanvas();
  }

  scale: number = 1;

  DrawCanvas() {
    if (!this.canvasRef || !this.texts) return;

    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');

    let width = this.outerBoxWidth;
    let height = this.outerBoxHeight;
    this.scale = 1;
    if (height > 1000) {
      this.scale = 1000 / height;
      height = 1000;
      width *= this.scale;
    }

    if (canvas.width === 1 && canvas.height === 1) {
      canvas.width = width;
      canvas.height = height;
      ctx.scale(this.scale, this.scale);
    }

    ctx.clearRect(0, 0, this.outerBoxWidth, this.outerBoxHeight);
    ctx.font = `${this.formGroup.value.fontSize}px sans-serif`;
    ctx.textBaseline = 'top';

    if (this.formGroup.value.showBoundary) {
      for (const b of this.boundaryList) {
        const d = b.maxX - b.minX;
        ctx.strokeStyle = 'red';
        ctx.strokeRect(b.minX, 0, 1, this.outerBoxHeight);
        ctx.strokeStyle = 'black';
      }
    }

    for (const text of this.texts) {
      if (this.formGroup.value.showBoundingBox) {
        ctx.strokeRect(text.minX, text.minY, text.maxX - text.minX, text.maxY - text.minY);
      }
      if (text.selected) {
        const {width, fontBoundingBoxAscent, fontBoundingBoxDescent} = ctx.measureText(text.desc);
        ctx.fillStyle = '#8080ff';
        ctx.fillRect(text.minX, text.minY, width, fontBoundingBoxDescent - fontBoundingBoxAscent);
        ctx.fillStyle = '#000000';
      }
      ctx.fillText(text.desc, text.minX, text.minY);
    }

    if (this.selectedAreaStartPoint && this.selectedAreaEndPoint) {
      const x = Math.min(this.selectedAreaStartPoint.x, this.selectedAreaEndPoint.x);
      const y = Math.min(this.selectedAreaStartPoint.y, this.selectedAreaEndPoint.y);
      const w = Math.abs(this.selectedAreaStartPoint.x - this.selectedAreaEndPoint.x);
      const h = Math.abs(this.selectedAreaStartPoint.y - this.selectedAreaEndPoint.y);

      ctx.strokeRect(x, y, w, h);
    }
  }

  timestamp: number = 0;
  clicked = false;

  onMouseEvent(event: MouseEvent, type: 'down'|'move'|'up') {
    let x = event.offsetX / this.scale;
    let y = event.offsetY / this.scale;

    switch (type) {
      case 'down':
        this.selectedAreaStartPoint = new Point(x, y);
        this.selectedAreaEndPoint = undefined;
        this.clicked = true;
        break;
      case 'move':
        if (this.clicked)
          this.selectedAreaEndPoint = new Point(x, y);
        break;
      case 'up':
        this.clicked = false;
        this.selectedAreaEndPoint = new Point(x, y);
        this.SelectTexts();
        this.selectedAreaStartPoint = undefined;
        this.selectedAreaEndPoint = undefined;
        break;
    }

    const now = new Date();
    if (type === 'move') {
      if (this.timestamp + 10 > now.getTime()) {
        return;
      }
      if (!this.selectedAreaEndPoint) {
        return;
      }
    }

    this.timestamp = now.getTime();
    this.DrawCanvas();
  }

  SelectTexts() {
    if (!this.selectedAreaStartPoint || !this.selectedAreaEndPoint) return;

    const minX = Math.min(this.selectedAreaStartPoint.x, this.selectedAreaEndPoint.x);
    const maxX = Math.max(this.selectedAreaStartPoint.x, this.selectedAreaEndPoint.x);
    const minY = Math.min(this.selectedAreaStartPoint.y, this.selectedAreaEndPoint.y);
    const maxY = Math.max(this.selectedAreaStartPoint.y, this.selectedAreaEndPoint.y);

    for (const text of this.texts) {
      if (IsOverlapping(text.minX, text.maxX, minX, maxX) &&
          IsOverlapping(text.minY, text.maxY, minY, maxY)) {
        text.selected = !text.selected;
      }
    }
    const selectedText = this.texts.filter(text => text.selected).map(text => text.desc).join('\n');

    const permissionClipboardWrite = "clipboard-write" as PermissionName;
    navigator.permissions.query({name: permissionClipboardWrite}).then(result => {
      if (result.state == "granted" || result.state == "prompt") {
        navigator.clipboard.writeText(selectedText);
      }
    });
  }

  GetURL(photo: Photo) {
    //return `https://storage.cloud.google.com/${environment.storageBucketId}/${environment.storageRootFolder}/${photo.checksum}`;
    // This allows anonymous public access.
    return `https://storage.googleapis.com/${environment.storageBucketId}/${environment.storageRootFolder}/${photo.checksum}`;
  }

  ComputeTextStyle(text: TextAnnotation) {
    let top = text.minY * this.scale;
    let left = text.minX * this.scale;
    //if (this.outerBoxHeight > 1000) {
      //const scale = 1000 / this.outerBoxHeight;
      //top *= scale;
      //left *= scale;
    //}
    return {
      position: 'absolute',
      top: `${top}px`,
      left: `${left}px`,
      border: "1px solid black",
    };
  }

  ComputeOuterBoxStyle() {
    let height = this.outerBoxHeight * this.scale;
    let width = this.outerBoxWidth * this.scale;

    //if (this.outerBoxHeight > 1000) {
      //height *= 1000 / this.outerBoxHeight;
      //width *= 1000 / this.outerBoxHeight;
    //}
    return {
      width: `${width}px`,
      height: `${height}px`,
    }
  }

  ClearSelection() {
    this.selectedAreaStartPoint = undefined;
    this.selectedAreaEndPoint = undefined;
    for (const text of this.texts) {
      text.selected = false;
    }
    this.DrawCanvas();
  }

  onSelectionChange(event: any) {
    console.log(event);
    event.source.disabled = true;
    const oldValue = this.photo.process_state || 'NOT_STARTED';

    this.imageService.SetProcessState(this.photo.checksum, event.value).subscribe(
      (response) => {
        event.source.disabled = false;
        this.photo.process_state = event.value;
      },
      (error) => {
        console.error(error);
        event.source.disabled = false;
        event.source.value = oldValue;
      }
    );
  }
}
