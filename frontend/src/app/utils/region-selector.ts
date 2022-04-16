import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

interface RegionGroup {
  name: string,
  regions: string[],
}

// Source: https://zh.wikipedia.org/zh-tw/台灣地理區劃
export const RegionOptions: RegionGroup[] = [
  {
    name: '北台灣',
    regions: ['基隆市', '台北市', '新北市', '桃園市', '新竹市', '新竹縣', '宜蘭縣' ],
  },
  {
    name: '中台灣',
    regions: [ '苗栗縣', '台中市', '彰化縣', '南投縣', '雲林縣', ],
  },
  {
    name: '南台灣',
    regions: [ '嘉義縣', '嘉義市', '台南市', '高雄市', '屏東縣', '澎湖縣', ]
  },
  {
    name: '東台灣',
    regions: [ '花蓮縣', '台東縣', ]
  },
  {
    name: '外島',
    regions: [ '金門縣', '連江縣', ]
  },
];

const _flatRegionOptions = RegionOptions.map(x => x.regions).flat();


export function RegionValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (control.value === '') return null
    console.log(control.value);
    if (_flatRegionOptions.indexOf(control.value) === -1) {
      return {error: `${control.value} is invalid.`}
    }
    return null;
  }
}
