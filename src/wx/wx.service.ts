import { Injectable } from '@nestjs/common';

@Injectable()
export class WxService {
    getAd(ad: string): any {
        const trimmedAd = ad.trim().toUpperCase();
        const url = `https://aviationweather.gov/api/data/metar?ids=${trimmedAd}&format=json&taf=true`;

        return fetch(url)
        .then(response => response.json())
        .then(data => {
            return data?.[0];
        })
        .catch(error => {
            return {
                status: "error",
                message: error.message,
            };
        });
    }

    getSigmet(fir?: string) {
        const url = `https://aviationweather.gov/api/data/isigmet?fir=${fir}&format=json`;

        return fetch(url)
        .then(response => response.json())
        .then(data => {
            return data.filter((s) => (fir && s.firId === fir) || !fir);
        })
        .catch(error => {
            return {
                status: "error",
                message: error.message,
            };
        });
    }
}
