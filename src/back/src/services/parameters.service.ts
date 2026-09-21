import {SqliteService} from "./sqlite.service.js";
import {ParameterDto} from "../../../commons/data/dto/parameter-dto.js";
import {ParametersEnum} from "../../../commons/data/dto/parameters-enum.js";
import {CryptoService} from "./crypto.service.js";

export class ParametersService {
    public static getAll() {
        const db = SqliteService.getDatabase();

        try {
            const rows = db.prepare("SELECT * FROM PARAMETERS").all() as any[];

            const result = rows.map(row => {
                if(ParametersEnum.AI_API_KEY === row.code) {
                    let value = row.value as any;
                    if(value && value !== '') {
                        value = CryptoService.decryptString(row.value);
                        value = "*".repeat(value.length - 4) + value.substring(value.length - 3, value.length)
                    }
                    return new ParameterDto(ParametersEnum.AI_API_KEY.toString(), value);
                } else {
                    return new ParameterDto(row.code, row.value);
                }
            })

            return Promise.resolve(result);
        } catch (err) {
            console.error('Error fetching parameters:', err);
            return Promise.reject(new Error('Failed to fetch parameters'));
        }
    }

    public static updateParameterByCode(args: { code: string; value: any; }) {
        let {code, value} = args;

        const db = SqliteService.getDatabase();

        try {
            if(ParametersEnum.AI_API_KEY.toString() === code) {
                const actualParameter = this.getByCode(ParametersEnum.AI_API_KEY);
                if(value && value !== '') {
                    const obfuscedRegex = /[*]{2,}/gm;
                    if(!(value as string).match(obfuscedRegex)) {
                        value = CryptoService.encryptString(value);
                    } else {
                        value = actualParameter?.value
                    }
                }
            }

            db.prepare("UPDATE PARAMETERS SET VALUE = ? WHERE CODE = ?")
                .run(value, code);
        } catch (err) {
            console.error('Error updating parameters:', err);
            throw new Error('Failed to update parameters');
        }
    }

    public static getByCode(code: ParametersEnum) {
        const db = SqliteService.getDatabase();

        const row = db.prepare("SELECT * FROM PARAMETERS WHERE CODE = ?").get(code.toString()) as any;
        if(!row) return null;

        let value = row.value;
        if(ParametersEnum.AI_API_KEY.toString() === row.code) {
            if(value && value !== '') value = CryptoService.decryptString(row.value);
        }

        return new ParameterDto(row.code, value);
    }

    public static getAvailableCountries() {
        return Promise.resolve([
            { name: 'Australia', code: 'AU' },
            { name: 'Brazil', code: 'BR' },
            { name: 'China', code: 'CN' },
            { name: 'Egypt', code: 'EG' },
            { name: 'France', code: 'FR' },
            { name: 'Germany', code: 'DE' },
            { name: 'India', code: 'IN' },
            { name: 'Japan', code: 'JP' },
            { name: 'Spain', code: 'ES' },
            { name: 'United States', code: 'US' }
        ]);
    }
}
