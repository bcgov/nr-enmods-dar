import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";

@Injectable()
export class AdminService {
  constructor(private readonly httpService: HttpService) {}

  /**
   * Gets a list of all ??? users
   *
   * @returns all ??? users
   */
  async findAll(): Promise<any[]> {
    const bearerToken = await this.getToken();
    const role = "Enmods Admin";
    const url = `${process.env.users_api_base_url}/integrations/${process.env.integration_id}/${process.env.css_environment}/roles/${role}/users`;
    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };
    try {
      console.log("trying user api");
      const response = await firstValueFrom(this.httpService.get(url, config));
      console.log(response);
      return response.data.data;
    } catch (err) {
      console.log(err.response?.data || err.message);
      throw err;
    }
  }

  async getToken() {
    const url = process.env.users_api_token_url;
    const token = `${process.env.users_api_client_id}:${process.env.users_api_client_secret}`;
    const encodedToken = Buffer.from(token).toString("base64");
    const config = {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + encodedToken,
      },
    };
    const grantTypeParam = new URLSearchParams();
    grantTypeParam.append("grant_type", "client_credentials");
    try {
      const response = await firstValueFrom(
        this.httpService.post(url, grantTypeParam.toString(), config)
      );
      return response.data.access_token;
    } catch (error) {
      console.log(error.response?.data || error.message);
      throw error;
    }
  }
}
