import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { Role } from "src/enum/role.enum";
import { IdirUserInfo, UserInfo } from "src/types/types";

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
    const adminUrl = `${process.env.users_api_base_url}/integrations/${process.env.integration_id}/${process.env.css_environment}/roles/${Role.ENMODS_ADMIN}/users`;
    const userUrl = `${process.env.users_api_base_url}/integrations/${process.env.integration_id}/${process.env.css_environment}/roles/${Role.ENMODS_USER}/users`;
    const config = {
      headers: { Authorization: "Bearer " + bearerToken },
    };
    try {
      const adminResponse = await firstValueFrom(
        this.httpService.get(adminUrl, config)
      );

      const returnData: UserInfo[] = [];
      const adminData = adminResponse.data.data;
      adminData.map((admin: IdirUserInfo) => {
        console.log(admin);
        returnData.push({
          username: admin.attributes.idir_username[0],
          email: admin.email,
          name: admin.firstName + " " + admin.lastName,
          company: "Not Implemented",
          role: [Role.ENMODS_ADMIN],
        });
      });
      const userResponse = await firstValueFrom(
        this.httpService.get(userUrl, config)
      );
      const userData = userResponse.data.data;
      userData.map((user: IdirUserInfo) => {
        const existingUser = returnData.find(
          (u) => u.username === user.attributes.idir_username[0]
        );
        if (existingUser) {
          existingUser.role.push(Role.ENMODS_USER);
        } else {
          returnData.push({
            username: user.attributes.idir_username[0],
            email: user.email,
            name: user.firstName + " " + user.lastName,
            company: "Not Implemented",
            role: [Role.ENMODS_USER],
          });
        }
      });
      console.log([...adminData, ...userData]);
      console.log(adminData[0].attributes);
      return returnData;
    } catch (err) {
      console.log("Error findAll Admin");
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
