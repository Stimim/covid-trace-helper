import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const RegionOptions: string[] = [
  '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市', '新竹縣',
  '苗栗縣', '彰化縣', '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣',
  '花蓮縣', '台東縣', '澎湖縣', '金門縣', '連江縣', '基隆市', '新竹市',
  '嘉義市',
];

export function RegionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === '') return null
    if (RegionOptions.indexOf(control.value) === -1) {
      return {error: `${control.value} is invalid.`}
    }
    return null;
  }
}
