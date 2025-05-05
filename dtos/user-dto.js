module.exports = class UserDto {
	id;
	tgId;
	role;

	constructor(model) {
		this.id = model.id;
		this.tgId = model.tgId;
		this.role = model.role;
	}
};
