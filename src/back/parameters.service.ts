import {SqliteService} from "./sqlite.service";
import {ParameterDto} from "../commons/data/dto/parameter-dto";
import { safeStorage, app } from 'electron';
import {ParametersEnum} from "../commons/data/dto/parameters-enum";

export class ParametersService {
    public static getAll() {
        const db = SqliteService.getDatabase();

        try {
            const rows = db.prepare("SELECT * FROM PARAMETERS").all() as any[];

            const result = rows.map(row => {
                if(ParametersEnum.AI_API_KEY === row.code) {
                    let value = row.value as string;
                    if(value === null && value !== '') {
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

    public static updateParameterByCode(args) {
        let {code, value} = args;

        const db = SqliteService.getDatabase();

        try {
            if(ParametersEnum.AI_API_KEY.toString() === code) {
                if(value && value !== '') {
                    value = safeStorage.encryptString(value);
                }
            }

            db.prepare("UPDATE PARAMETERS SET VALUE = ? WHERE CODE = ?")
                .run(value, code);
        } catch (err) {
            console.error('Error updating parameters:', err);
            throw new Error('Failed to update parameters');
        }
    }
}