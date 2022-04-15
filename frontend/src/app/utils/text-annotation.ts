import { ElementRef } from '@angular/core';


declare var OPEN_CV_READY: boolean;
declare var cv: any;


const SETTING = {
  VERTICAL_LINE_LENGTH_THRESHOLD: 0.04,
  // How much overlap in X axis should be count as a new row?
  NEW_ROW_DETECTION_THRESHOLD: 0.5,
};


export function IsOverlapping(x0: number, x1: number, y0: number, y1: number) {
  return (x0 <= y0 && y0 <= x1) || (y0 <= x0 && x0 <= y1);
}


export class TextAnnotation {
  desc: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  selected: boolean = false;
  measured: boolean = false;
  columnIndex: number = -1;

  constructor([desc, minX, maxX, minY, maxY]: [string, number, number, number, number]) {
    this.desc = desc;
    this.minX = minX
    this.maxX = maxX
    this.minY = minY
    this.maxY = maxY
  }

  ShouldMerge(other: TextAnnotation) {
    if (!IsOverlapping(this.minY, this.maxY, other.minY, other.maxY))
      return false;
    if (this.minY === other.minY && this.maxY === other.maxY) {
      return true;
    }
    const threshold = (this.maxX - this.minX) * SETTING.NEW_ROW_DETECTION_THRESHOLD;
    if (this.maxX - other.minX > threshold) {
      // My right boundary is in the right of the left boundary of other
      return false;
    }
    //if (this.maxX + 8 < other.minX)
      //// The gap between to boxes is too large
      //return false;
    return true;
  }

  Merge(other: TextAnnotation) {
    if (this.minX <= other.minX) {
      this.desc += other.desc;
    } else {
      this.desc = other.desc + this.desc;
    }

    this.minX = Math.min(this.minX, other.minX);
    this.maxX = Math.max(this.maxX, other.maxX);
    this.minY = Math.min(this.minY, other.minY);
    this.maxY = Math.max(this.maxY, other.maxY);
  }
};


async function DetectBoundary(imgRef: ElementRef): Promise<TextAnnotation[]> {
  // console.info('start DetectBoundary');
  const img = imgRef.nativeElement;
  const image = cv.imread(img);
  const edgeImage = new cv.Mat();

  // Turn into gray scale.
  cv.cvtColor(image, edgeImage, cv.COLOR_RGB2GRAY, 0);
  cv.blur(edgeImage, edgeImage, new cv.Size(3, 3));
  const lowThreshold = 5;
  const ratio = 3;
  const kernelSize = 3;
  cv.Canny(edgeImage, edgeImage, lowThreshold, ratio * lowThreshold, kernelSize);

  // Detect vertical line pixels.
  let verticalStructure = cv.getStructuringElement(
    cv.MORPH_RECT,
    new cv.Size(1, SETTING.VERTICAL_LINE_LENGTH_THRESHOLD * edgeImage.rows));
  cv.erode(edgeImage, edgeImage, verticalStructure, new cv.Point(-1, -1));
  cv.dilate(edgeImage, edgeImage, verticalStructure, new cv.Point(-1, -1));

  // Merge nearby lines.
  const squareStructure = cv.getStructuringElement(
    cv.MORPH_RECT, new cv.Size(10, 10));
  cv.dilate(edgeImage, edgeImage, squareStructure, new cv.Point(-1, -1));
  cv.erode(edgeImage, edgeImage, squareStructure, new cv.Point(-1, -1));

  // Merge vertical lines.
  verticalStructure = cv.getStructuringElement(
    cv.MORPH_RECT, new cv.Size(1, edgeImage.rows / 10));
  cv.dilate(edgeImage, edgeImage, verticalStructure, new cv.Point(-1, -1));
  cv.erode(edgeImage, edgeImage, verticalStructure, new cv.Point(-1, -1));

  // Label pixels of vertical lines by finding connected components.
  const labelledImage = new cv.Mat(edgeImage.size(), cv.CV_16U);
  const labelCount = cv.connectedComponents(edgeImage, labelledImage, 8);
  const boxList = [];

  console.info('labelCount: ', labelCount);

  if (labelCount > 1) {
    for (let i = 0; i < labelCount - 1; i++) {
      boxList.push(
        new TextAnnotation(
          ['', labelledImage.cols+1, -1, labelledImage.rows+1, -1]));
    }
    for (let i = 0; i < labelledImage.rows; i++) {
      for (let j = 0; j < labelledImage.cols; j++) {
        const v = labelledImage.ucharPtr(i, j)[0];
        if (v == 0) continue;
        boxList[v - 1].Merge(new TextAnnotation(['', j, j, i, i]));
      }
    }
    boxList.sort((a, b) => {
      return a.minX - b.minX
    });
  }

  labelledImage.delete();
  squareStructure.delete();
  verticalStructure.delete();
  edgeImage.delete();
  image.delete();

  return boxList;
}


function FindColumn(boundaryList: TextAnnotation[], text: TextAnnotation) {
  if (boundaryList.length === 0) return -1;
  for (let i = 0; i < boundaryList.length; i++) {
    if (text.maxX < boundaryList[i].minX) {
      return i;
    }
  }
  return boundaryList.length;
}


function MergeRows(toProcess: TextAnnotation[]) {
  const result: TextAnnotation[] = [];
  // Google Vision API should sort the text annotations with a natural reading order
  // (top to down, left to right). So there is no need to sort it by ourselves.
  // toProcess.sort((a, b) => a.minX - b.minX);
  for (const text of toProcess) {
    if (result.length === 0) {
      result.push(text);
      continue;
    }

    const prev = result[result.length - 1];
    if (prev.ShouldMerge(text)) {
      prev.Merge(text);
    } else {
      result.push(text);
    }
  }
  return result;
}


export async function ProcessTextAnnotation(
    imgRef: ElementRef, textAnnotations: TextAnnotation[]): Promise<[TextAnnotation[], TextAnnotation[], number, number]> {
  const boundaryList = await DetectBoundary(imgRef);
  let retval: TextAnnotation[] = [];
  let width = 0;
  let height = 0;
  let index = -1;

  for (const text of textAnnotations) {
    // update width, height
    width = Math.max(text.maxX, width);
    height = Math.max(text.maxY, height);
  }

  for (const boundary of boundaryList) {
    console.log(boundary);
    const toProcess: TextAnnotation[] = [];
    const toSkip: TextAnnotation[] = [];

    for (const text of textAnnotations) {
      if (IsOverlapping(text.minY, text.maxY, boundary.minY, boundary.maxY)) {
        const midX = (text.minX + text.maxX) / 2;
        if (midX < boundary.minX) {
          toProcess.push(text);
          continue;
        }
      }
      toSkip.push(text);
    }

    retval.push(...MergeRows(toProcess));
    textAnnotations = toSkip;
  }

  retval.push(...MergeRows(textAnnotations));

  retval.sort((a, b) => {
    return a.minY - b.minY;
  });
  return [retval, boundaryList, width, height];
}
